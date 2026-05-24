export type TaskStatus   = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Profile {
  id:         string;
  email:      string;
  full_name:  string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Task {
  id:          string;
  title:       string;
  description: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  created_by:  string;
  assigned_to: string | null;
  creator:     Profile | null;
  assignee:    Profile | null;
  created_at:  string;
  updated_at:  string;
}

export interface CreateTaskPayload {
  title:       string;
  description?: string;
  assigned_to?: string | null;
  priority?:   TaskPriority;
}

export interface UpdateTaskPayload {
  title?:       string;
  description?: string;
  status?:      TaskStatus;
  priority?:    TaskPriority;
  assigned_to?: string | null;
}
