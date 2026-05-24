"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Task, Profile, TaskPriority } from "@/types";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";

interface Props {
  users:         Profile[];
  currentUserId: string;
  onClose:       () => void;
  onCreate:      (task: Task) => void;
}

export default function CreateTaskModal({ users, currentUserId, onClose, onCreate }: Props) {
  const [title,      setTitle]      = useState("");
  const [desc,       setDesc]       = useState("");
  const [priority,   setPriority]   = useState<TaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const task = await api.createTask({
        title:       title.trim(),
        description: desc.trim(),
        priority,
        assigned_to: assignedTo || null,
      });
      onCreate(task);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[#111] border border-[#1f1f1f] rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1a1a1a]">
          <h2 className="font-semibold text-base">Create task</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Add details…"
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Priority</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as TaskPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    priority === p
                      ? p === "low"    ? "bg-green-400/15 border-green-400/40 text-green-400"
                      : p === "medium" ? "bg-amber-400/15 border-amber-400/40 text-amber-400"
                      :                  "bg-red-400/15   border-red-400/40   text-red-400"
                      : "border-[#2a2a2a] text-zinc-600 hover:border-[#3a3a3a]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Assign to */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Assign to</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name ?? u.email}{u.id === currentUserId ? " (you)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-sm text-zinc-400 hover:border-[#3a3a3a] hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : "Create task"}
          </button>
        </div>
      </div>
    </div>
  );
}
