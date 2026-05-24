"""
email_service.py
Sends transactional emails via Gmail SMTP (App Password).
"""
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


GMAIL_USER = os.getenv("GMAIL_USER")       # your@gmail.com
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")   # 16-char app password


def _send(to_email: str, subject: str, html_body: str):
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print(f"[EMAIL] SMTP not configured – skipping email to {to_email}")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"TaskFlow <{GMAIL_USER}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html_body, "html"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())
        print(f"[EMAIL] Sent '{subject}' → {to_email}")
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")


def send_task_created_email(to_email: str, name: str, task: dict):
    priority_color = {"low": "#22c55e", "medium": "#f59e0b", "high": "#ef4444"}.get(
        task.get("priority", "medium"), "#f59e0b"
    )
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">TaskFlow</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">New task assigned</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;">Hi <strong style="color:#fff">{name}</strong>,</p>
            <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;">A new task has been created and involves you:</p>
            <div style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:24px;margin-bottom:24px;">
              <h2 style="margin:0 0 8px;color:#fff;font-size:18px;">{task['title']}</h2>
              <p style="margin:0 0 16px;color:#71717a;font-size:14px;line-height:1.6;">{task.get('description','No description provided.')}</p>
              <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:{priority_color}22;color:{priority_color};border:1px solid {priority_color}44;">
                {task.get('priority','medium').upper()} PRIORITY
              </span>
            </div>
            <p style="margin:0;color:#52525b;font-size:13px;">Log in to TaskFlow to view details and update the task status.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2a2a2a;">
            <p style="margin:0;color:#3f3f46;font-size:12px;">TaskFlow — Team task management. You're receiving this because you are a TaskFlow user.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    _send(to_email, f"📋 New Task: {task['title']}", html)


def send_task_completed_email(to_email: str, name: str, task: dict):
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">TaskFlow</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Task completed ✓</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;">Hi <strong style="color:#fff">{name}</strong>,</p>
            <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;">Great news — the following task has been marked as <strong style="color:#10b981">completed</strong>:</p>
            <div style="background:#111;border:1px solid #10b98133;border-radius:8px;padding:24px;margin-bottom:24px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#10b981;border-radius:50%;color:#fff;font-size:14px;">✓</span>
                <h2 style="margin:0;color:#fff;font-size:18px;">{task['title']}</h2>
              </div>
              <p style="margin:0;color:#71717a;font-size:14px;line-height:1.6;">{task.get('description','')}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2a2a2a;">
            <p style="margin:0;color:#3f3f46;font-size:12px;">TaskFlow — Team task management.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    _send(to_email, f"✅ Completed: {task['title']}", html)
