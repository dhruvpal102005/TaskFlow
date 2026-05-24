"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import type { Task, Profile } from "@/types";
import TaskCard from "@/components/TaskCard";
import CreateTaskModal from "@/components/CreateTaskModal";
import Image from "next/image";

type FilterStatus = "all" | "todo" | "in_progress" | "done";

export default function DashboardPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<Profile | null>(null);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [users,      setUsers]      = useState<Profile[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<FilterStatus>("all");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, allTasks, allUsers] = await Promise.all([api.getMe(), api.getTasks(), api.getUsers()]);
      setUser(me); setTasks(allTasks); setUsers(allUsers);
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
    await createClient().auth.signOut();
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, background: "var(--bg)" }}>
        <div style={{ width: 22, height: 22, border: "2px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const tabs: { key: FilterStatus; label: string }[] = [
    { key: "all",         label: "All" },
    { key: "todo",        label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "done",        label: "Done" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 220, minWidth: 220,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "20px 12px",
        zIndex: 20,
        overflow: "hidden",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 8px", marginBottom: 28 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-headline" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            TaskFlow
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { icon: "dashboard", label: "Dashboard", active: true },
            { icon: "assignment", label: "My Tasks" },
            { icon: "group", label: "Team" },
            { icon: "settings", label: "Settings" },
          ].map(item => (
            <a
              key={item.label}
              href="#"
              className={`nav-item${item.active ? " active" : ""}`}
              onClick={e => e.preventDefault()}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 19, ...(item.active ? { fontVariationSettings: "'FILL' 1" } : {}) }}
              >
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div
            className="nav-item"
            onClick={handleSignOut}
            title="Sign out"
            style={{ justifyContent: "space-between", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {user?.avatar_url ? (
                <Image src={user.avatar_url} alt="" width={28} height={28} style={{ borderRadius: "50%", border: "1px solid var(--border)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--brand)" }}>person</span>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
                  {user?.full_name ?? "User"}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--text-muted)", flexShrink: 0 }}>logout</span>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header style={{
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <h1 className="font-headline" style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", transition: "color 0.12s" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 21 }}>notifications</span>
            </button>
            <button
              id="btn-new-task"
              onClick={() => setShowCreate(true)}
              className="btn-primary"
              style={{ padding: "8px 14px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
              New Task
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px" }}>

            {/* Greeting */}
            <div style={{ marginBottom: 32 }}>
              <h2 className="font-headline" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                Good {greeting()}, {user?.full_name?.split(" ")[0] ?? "there"}
              </h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                {counts.all} task{counts.all !== 1 ? "s" : ""} across all your work
              </p>
            </div>

            {/* Stats row — divider style, no cards */}
            <div style={{
              display: "flex",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 32,
            }}>
              {[
                { label: "All Tasks",    value: counts.all         },
                { label: "To Do",        value: counts.todo        },
                { label: "In Progress",  value: counts.in_progress },
                { label: "Completed",    value: counts.done        },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-secondary)", marginBottom: 4 }}>
                    {s.label}
                  </p>
                  <p className="font-headline" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Filter tabs — underline style */}
            <div style={{ borderBottom: "1px solid var(--border)", display: "flex", gap: 28, marginBottom: 24, marginTop: -4 }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  className={`filter-tab${filter === t.key ? " active" : ""}`}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                  <span style={{ marginLeft: 5, fontSize: "0.7rem", opacity: 0.6 }}>{counts[t.key]}</span>
                </button>
              ))}
            </div>

            {/* Task grid */}
            {filtered.length === 0 ? (
              <div style={{ paddingTop: 60, paddingBottom: 60, textAlign: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "var(--brand-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--brand)" }}>task_alt</span>
                </div>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No tasks here</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Click &ldquo;New Task&rdquo; to add one</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}>
                {filtered.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={user?.id ?? ""}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUpdate={updated => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))}
                    users={users}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateTaskModal
          users={users}
          currentUserId={user?.id ?? ""}
          onClose={() => setShowCreate(false)}
          onCreate={task => { setTasks(prev => [task, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
