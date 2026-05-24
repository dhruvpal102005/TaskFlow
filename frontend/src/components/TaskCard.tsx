"use client";

import { useState } from "react";
import type { Task, Profile } from "@/types";
import { api } from "@/lib/api";
import { Trash2, User, ChevronDown } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface Props {
  task:            Task;
  currentUserId:   string;
  users:           Profile[];
  onStatusChange:  (id: string, status: Task["status"]) => void;
  onDelete:        (id: string) => void;
  onUpdate:        (task: Task) => void;
}

const STATUS_OPTS: { value: Task["status"]; label: string; color: string; bg: string }[] = [
  { value: "todo",        label: "To Do",       color: "text-amber-400",   bg: "bg-amber-400/10  border-amber-400/20" },
  { value: "in_progress", label: "In Progress", color: "text-blue-400",    bg: "bg-blue-400/10   border-blue-400/20"  },
  { value: "done",        label: "Done",        color: "text-green-400",   bg: "bg-green-400/10  border-green-400/20" },
];

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  low:    "text-green-400  bg-green-400/10  border-green-400/20",
  medium: "text-amber-400  bg-amber-400/10  border-amber-400/20",
  high:   "text-red-400    bg-red-400/10    border-red-400/20",
};

export default function TaskCard({ task, currentUserId, users, onStatusChange, onDelete, onUpdate }: Props) {
  const [open, setOpen] = useState(false);

  const st     = STATUS_OPTS.find(s => s.value === task.status)!;
  const canEdit = task.created_by === currentUserId || task.assigned_to === currentUserId;

  async function handleStatus(status: Task["status"]) {
    onStatusChange(task.id, status);
    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    onDelete(task.id);
  }

  return (
    <div className={`group relative bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 flex flex-col gap-3 hover:border-[#2a2a2a] transition-all animate-slide-up ${task.status === "done" ? "opacity-60" : ""}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-semibold text-sm leading-snug flex-1 ${task.status === "done" ? "line-through text-zinc-500" : ""}`}>
          {task.title}
        </h3>
        {task.created_by === currentUserId && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Priority badge */}
      <span className={`self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[task.priority]}`}>
        {task.priority}
      </span>

      {/* Status selector */}
      <div className="relative">
        <button
          onClick={() => canEdit && setOpen(!open)}
          disabled={!canEdit}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${st.bg} ${st.color} ${canEdit ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        >
          {st.label}
          {canEdit && <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />}
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl min-w-[140px]">
            {STATUS_OPTS.map(s => (
              <button
                key={s.value}
                onClick={() => handleStatus(s.value)}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5 ${s.color} ${task.status === s.value ? "bg-white/5" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer: assignee + time */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-1.5">
          {task.assignee?.avatar_url ? (
            <Image src={task.assignee.avatar_url} alt="" width={18} height={18} className="rounded-full" />
          ) : (
            <div className="w-4.5 h-4.5 rounded-full bg-zinc-800 flex items-center justify-center">
              <User size={9} className="text-zinc-500" />
            </div>
          )}
          <span className="text-[11px] text-zinc-500 truncate max-w-[100px]">
            {task.assignee?.full_name ?? task.assignee?.email ?? "Unassigned"}
          </span>
        </div>
        <span className="text-[11px] text-zinc-600">
          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
