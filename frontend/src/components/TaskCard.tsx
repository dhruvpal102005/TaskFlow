"use client";

import { useState } from "react";
import type { Task, Profile } from "@/types";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface Props {
  task: Task;
  currentUserId: string;
  users: Profile[];
  onStatusChange: (id: string, status: Task["status"]) => void;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
}

const STATUS_OPTS: { value: Task["status"]; label: string; cls: string }[] = [
  { value: "todo",        label: "To Do",       cls: "badge-todo"     },
  { value: "in_progress", label: "In Progress", cls: "badge-progress" },
  { value: "done",        label: "Done",         cls: "badge-done"     },
];

const STRIPE: Record<Task["priority"], string> = {
  high:   "stripe-high",
  medium: "stripe-medium",
  low:    "stripe-low",
};

export default function TaskCard({
  task,
  currentUserId,
  onStatusChange,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const st      = STATUS_OPTS.find(s => s.value === task.status)!;
  const isDone  = task.status === "done";
  const canEdit = task.created_by === currentUserId || task.assigned_to === currentUserId;

  const initials = (task.assignee?.full_name ?? task.assignee?.email ?? "?")
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article
      className={`task-card animate-slide-up ${STRIPE[task.priority]}`}
      style={{ opacity: isDone ? 0.72 : 1 }}
    >
      <div style={{ padding: "16px 16px 16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top row: status badge + delete button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>

          {/* Status dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => canEdit && setMenuOpen(o => !o)}
              disabled={!canEdit}
              className={`badge ${st.cls}`}
              style={{ cursor: canEdit ? "pointer" : "default", border: "none", fontFamily: "Inter, sans-serif" }}
            >
              {st.label}
              {canEdit && (
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 12, marginLeft: 3, verticalAlign: "middle",
                    transition: "transform 0.15s",
                    transform: menuOpen ? "rotate(180deg)" : "none",
                  }}
                >
                  expand_more
                </span>
              )}
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 8, zIndex: 30, minWidth: 140, overflow: "hidden",
              }}>
                {STATUS_OPTS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { onStatusChange(task.id, s.value); setMenuOpen(false); }}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "8px 12px", background: "none",
                      border: "none", cursor: "pointer",
                      fontSize: "0.8rem", fontWeight: 500,
                      fontFamily: "Inter, sans-serif",
                      color: task.status === s.value ? "var(--brand)" : "var(--text-primary)",
                      transition: "background 0.1s",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                  >
                    <span className={`badge ${s.cls}`} style={{ pointerEvents: "none", fontFamily: "Inter, sans-serif" }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete (visible on card hover via CSS) */}
          {task.created_by === currentUserId && (
            <button
              onClick={() => { if (confirm("Delete this task?")) onDelete(task.id); }}
              className="task-delete-btn"
              title="Delete task"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            </button>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-headline"
          style={{
            fontSize: "0.95rem", fontWeight: 600,
            color: isDone ? "var(--text-secondary)" : "var(--text-primary)",
            lineHeight: 1.4, marginBottom: 6,
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p style={{
            fontSize: "0.8rem", color: "var(--text-secondary)",
            lineHeight: 1.55, marginBottom: 8,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div style={{
          marginTop: "auto", paddingTop: 12,
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: "0.72rem", color: "var(--text-secondary)",
        }}>
          {/* Assignee */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {task.assignee?.avatar_url ? (
              <Image
                src={task.assignee.avatar_url}
                alt={task.assignee.full_name ?? "Assignee"}
                width={22} height={22}
                style={{ borderRadius: "50%", border: "1px solid var(--border)" }}
              />
            ) : (
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "var(--brand-light)", color: "var(--brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", fontWeight: 700, border: "1px solid var(--border)",
                flexShrink: 0,
              }}>
                {initials}
              </div>
            )}
            <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.assignee?.full_name ?? task.assignee?.email ?? "Unassigned"}
            </span>
          </div>

          {/* Relative time */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
            <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
