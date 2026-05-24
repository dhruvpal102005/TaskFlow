from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from email_service import send_task_created_email, send_task_completed_email
from functools import wraps
import jwt

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")])

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# ── Auth middleware ──────────────────────────────────────────────────────────

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            user = supabase.auth.get_user(token)
            request.user = user.user
        except Exception as e:
            return jsonify({"error": "Invalid token", "detail": str(e)}), 401
        return f(*args, **kwargs)
    return decorated


# ── Health ───────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ── Users ────────────────────────────────────────────────────────────────────

@app.route("/api/users", methods=["GET"])
@require_auth
def get_users():
    """Return all registered users (for assignment dropdown)."""
    res = supabase.table("profiles").select("id, email, full_name, avatar_url").execute()
    return jsonify(res.data)


@app.route("/api/users/me", methods=["GET"])
@require_auth
def get_me():
    uid = request.user.id
    res = supabase.table("profiles").select("*").eq("id", uid).single().execute()
    return jsonify(res.data)


# ── Tasks ────────────────────────────────────────────────────────────────────

@app.route("/api/tasks", methods=["GET"])
@require_auth
def get_tasks():
    uid = request.user.id
    res = (
        supabase.table("tasks")
        .select(
            "*, creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),"
            "assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)"
        )
        .or_(f"created_by.eq.{uid},assigned_to.eq.{uid}")
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(res.data)


@app.route("/api/tasks", methods=["POST"])
@require_auth
def create_task():
    uid = request.user.id
    body = request.get_json()

    title       = body.get("title", "").strip()
    description = body.get("description", "").strip()
    assigned_to = body.get("assigned_to")  # UUID or None
    priority    = body.get("priority", "medium")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    task_data = {
        "title":       title,
        "description": description,
        "created_by":  uid,
        "assigned_to": assigned_to,
        "status":      "todo",
        "priority":    priority,
    }
    res = supabase.table("tasks").insert(task_data).execute()
    task = res.data[0]

    # Notify creator
    creator = supabase.table("profiles").select("email, full_name").eq("id", uid).single().execute().data
    send_task_created_email(creator["email"], creator["full_name"], task)

    # Notify assignee if different
    if assigned_to and assigned_to != uid:
        assignee = supabase.table("profiles").select("email, full_name").eq("id", assigned_to).single().execute().data
        send_task_created_email(assignee["email"], assignee["full_name"], task)

    return jsonify(task), 201


@app.route("/api/tasks/<task_id>", methods=["GET"])
@require_auth
def get_task(task_id):
    uid = request.user.id
    res = (
        supabase.table("tasks")
        .select(
            "*, creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),"
            "assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)"
        )
        .eq("id", task_id)
        .single()
        .execute()
    )
    task = res.data
    if task["created_by"] != uid and task.get("assigned_to") != uid:
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(task)


@app.route("/api/tasks/<task_id>", methods=["PUT"])
@require_auth
def update_task(task_id):
    uid = request.user.id
    body = request.get_json()

    # Fetch existing
    existing = supabase.table("tasks").select("*").eq("id", task_id).single().execute().data
    if existing["created_by"] != uid and existing.get("assigned_to") != uid:
        return jsonify({"error": "Forbidden"}), 403

    allowed = ["title", "description", "status", "priority", "assigned_to"]
    update_data = {k: v for k, v in body.items() if k in allowed}

    res = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
    task = res.data[0]

    # Send completion emails
    if update_data.get("status") == "done" and existing["status"] != "done":
        creator  = supabase.table("profiles").select("email, full_name").eq("id", task["created_by"]).single().execute().data
        send_task_completed_email(creator["email"], creator["full_name"], task)
        if task.get("assigned_to") and task["assigned_to"] != task["created_by"]:
            assignee = supabase.table("profiles").select("email, full_name").eq("id", task["assigned_to"]).single().execute().data
            send_task_completed_email(assignee["email"], assignee["full_name"], task)

    return jsonify(task)


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id):
    uid = request.user.id
    existing = supabase.table("tasks").select("created_by").eq("id", task_id).single().execute().data
    if existing["created_by"] != uid:
        return jsonify({"error": "Only task creator can delete"}), 403
    supabase.table("tasks").delete().eq("id", task_id).execute()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
