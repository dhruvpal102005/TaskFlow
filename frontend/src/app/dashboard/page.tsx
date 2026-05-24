"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import type { Task, Profile } from "@/types";
import TaskCard from "@/components/TaskCard";
import CreateTaskModal from "@/components/CreateTaskModal";
import { LogOut, Plus, CheckSquare, Clock, CheckCircle2, LayoutGrid, User } from "lucide-react";
import Image from "next/image";

type FilterStatus = "all" | "todo" | "in_progress" | "done";

export default function DashboardPage() {
  const router  = useRouter();
  const [user,    setUser]    = useState<Profile | null>(null);
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [users,   setUsers]   = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<FilterStatus>("all");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, allTasks, allUsers] = await Promise.all([
        api.getMe(),
        api.getTasks(),
        api.getUsers(),
      ]);
      setUser(me);
      setTasks(allTasks);
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace("/"); return; }
      load();
    });
  }, [router, load]);

  async function handleSignOut() {
    const sb = createClient();
    await sb.auth.signOut();
    router.replace("/");
  }

  async function handleStatusChange(taskId: string, status: Task["status"]) {
    await api.updateTask(taskId, { status });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  }

  async function handleDelete(taskId: string) {
    await api.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  const filtered = tasks.filter(t => filter === "all" || t.status === filter);

  const counts = {
    all:         tasks.length,
    todo:        tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done:        tasks.filter(t => t.status === "done").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-500">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight">TaskFlow</span>
          </div>

          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <Image src={user.avatar_url} alt={user.full_name ?? "User"} width={28} height={28} className="rounded-full ring-1 ring-white/10" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <User size={14} className="text-indigo-400" />
              </div>
            )}
            <span className="text-sm text-zinc-400 hidden sm:inline">{user?.full_name ?? user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Page title + new task */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good {getGreeting()}, {user?.full_name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {counts.todo} open · {counts.in_progress} in progress · {counts.done} done
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
          >
            <Plus size={16} /> New task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {statCards(counts).map(s => (
            <div key={s.label} className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.Icon size={14} className={s.color} />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[#111] border border-[#1f1f1f] rounded-xl p-1 mb-6 w-fit">
          {(["all", "todo", "in_progress", "done"] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : capitalize(f)}
              <span className="ml-1.5 text-xs opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <CheckSquare size={24} className="text-indigo-400" />
            </div>
            <p className="text-zinc-400 font-medium">No tasks here yet</p>
            <p className="text-zinc-600 text-sm mt-1">Create a new task to get started</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={user?.id ?? ""}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onUpdate={(updated) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))}
                users={users}
              />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateTaskModal
          users={users}
          currentUserId={user?.id ?? ""}
          onClose={() => setShowCreate(false)}
          onCreate={(task) => { setTasks(prev => [task, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function statCards(counts: Record<string, number>) {
  return [
    { label: "Total",       value: counts.all,         Icon: LayoutGrid,   color: "text-zinc-400" },
    { label: "To Do",       value: counts.todo,        Icon: Clock,        color: "text-amber-400" },
    { label: "In Progress", value: counts.in_progress, Icon: CheckSquare,  color: "text-blue-400"  },
    { label: "Completed",   value: counts.done,        Icon: CheckCircle2, color: "text-green-400" },
  ];
}
