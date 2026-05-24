"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Task, Profile, TaskPriority } from "@/types";
import Image from "next/image";

interface Props {
  users: Profile[];
  currentUserId: string;
  onClose: () => void;
  onCreate: (task: Task) => void;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string; bg: string; border: string }[] = [
  { value: "low",    label: "Low",    color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: "medium", label: "Medium", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  { value: "high",   label: "High",   color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
];

export default function CreateTaskModal({ users, currentUserId, onClose, onCreate }: Props) {
  const [title,      setTitle]      = useState("");
  const [desc,       setDesc]       = useState("");
  const [priority,   setPriority]   = useState<TaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      const task = await api.createTask({
        title: title.trim(), description: desc.trim(),
        priority, assigned_to: assignedTo || null,
      });
      onCreate(task);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }}
      />

      {/* Modal */}
      <div
        className="animate-slide-up"
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: 460,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: "1px solid var(--border)",
        }}>
          <h2 className="font-headline" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Create task
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4, borderRadius: 5, transition: "color 0.12s" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 19 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 6, padding: "8px 12px",
              fontSize: "0.8rem", color: "#991b1b",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>error</span>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: 5 }}>
              Title <span style={{ color: "var(--high)" }}>*</span>
            </label>
            <input
              id="input-task-title"
              className="input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: 5 }}>
              Description
            </label>
            <textarea
              className="input"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Add details or context…"
              rows={3}
              style={{ resize: "none" }}
            />
          </div>

          {/* Priority */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
              Priority
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {PRIORITIES.map(p => {
                const active = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    style={{
                      flex: 1, padding: "8px 0",
                      borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      border: "1px solid",
                      cursor: "pointer", transition: "all 0.12s",
                      background: active ? p.bg : "transparent",
                      borderColor: active ? p.border : "var(--border)",
                      color: active ? p.color : "var(--text-secondary)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assign to */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
              Assign to
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto" }}>
              <UserRow
                label="Unassigned"
                selected={assignedTo === ""}
                onClick={() => setAssignedTo("")}
              />
              {users.map(u => (
                <UserRow
                  key={u.id}
                  label={u.full_name ?? u.email}
                  sub={u.id === currentUserId ? "You" : u.email}
                  avatarUrl={u.avatar_url ?? undefined}
                  selected={assignedTo === u.id}
                  onClick={() => setAssignedTo(u.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", gap: 8, padding: "14px 20px",
          borderTop: "1px solid var(--border)",
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: "9px 0" }}>
            Cancel
          </button>
          <button
            id="btn-create-task"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary"
            style={{ flex: 2, padding: "9px 0", justifyContent: "center" }}
          >
            {saving ? (
              <>
                <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Creating…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_task</span>
                Create Task
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function UserRow({
  label, sub, avatarUrl, selected, onClick,
}: {
  label: string | null; sub?: string; avatarUrl?: string; selected: boolean; onClick: () => void;
}) {
  const initials = (label ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "7px 10px", borderRadius: 7,
        cursor: "pointer", transition: "background 0.1s",
        background: selected ? "var(--brand-light)" : "transparent",
        border: `1px solid ${selected ? "rgba(79,70,229,0.2)" : "transparent"}`,
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "var(--bg)"; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={label ?? ""} width={26} height={26} style={{ borderRadius: "50%", border: "1px solid var(--border)", flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          background: selected ? "var(--brand)" : "var(--bg)",
          color: selected ? "#fff" : "var(--text-secondary)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.62rem", fontWeight: 700,
        }}>
          {label === "Unassigned" ? (
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person_off</span>
          ) : initials}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 500, color: selected ? "var(--brand)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label ?? "Unassigned"}
        </div>
        {sub && (
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub}
          </div>
        )}
      </div>
      {selected && <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--brand)", flexShrink: 0 }}>check</span>}
    </div>
  );
}
