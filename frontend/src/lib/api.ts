import { createClient } from "./supabase";
import type { Task, CreateTaskPayload, UpdateTaskPayload, Profile } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getToken(): Promise<string | null> {
  const sb = createClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Tasks
  getTasks:   ()                                   => apiFetch<Task[]>("/api/tasks"),
  getTask:    (id: string)                         => apiFetch<Task>(`/api/tasks/${id}`),
  createTask: (data: CreateTaskPayload)            => apiFetch<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: UpdateTaskPayload) => apiFetch<Task>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string)                         => apiFetch<{ success: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),

  // Users
  getUsers: () => apiFetch<Profile[]>("/api/users"),
  getMe:    () => apiFetch<Profile>("/api/users/me"),
};
