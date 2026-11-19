import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskInput } from "@/lib/validation/task";

export class TaskRepository {
  constructor(private readonly client: SupabaseClient) {}
  async list(userId: string) { return this.client.from("tasks").select("id,user_id,title,description,priority,due_date,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }); }
  async get(userId: string, id: string) { return this.client.from("tasks").select("id,user_id,title,description,priority,due_date,status,created_at").eq("user_id", userId).eq("id", id).maybeSingle(); }
  async create(userId: string, data: TaskInput) { return this.client.from("tasks").insert({ ...data, user_id: userId }).select("id,user_id,title,description,priority,due_date,status,created_at").single(); }
  async update(userId: string, id: string, data: Partial<TaskInput>) { return this.client.from("tasks").update(data).eq("user_id", userId).eq("id", id).select("id,user_id,title,description,priority,due_date,status,created_at").maybeSingle(); }
  async delete(userId: string, id: string) { return this.client.from("tasks").delete().eq("user_id", userId).eq("id", id).select("id").maybeSingle(); }
}
