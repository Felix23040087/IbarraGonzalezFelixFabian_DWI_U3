import { createClient } from "@/lib/supabase/server";
import { TaskRepository } from "@/lib/repositories/tasks";
import { taskIdSchema, taskInputSchema, taskPatchSchema } from "@/lib/validation/task";
import { NextResponse } from "next/server";

type AuthResult = { response: NextResponse } | { client: Awaited<ReturnType<typeof createClient>>; userId: string; repository: TaskRepository };
async function authenticated(): Promise<AuthResult> {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return { response: NextResponse.json({ error: "No autorizado." }, { status: 401 }) };
  return { client, userId, repository: new TaskRepository(client) };
}
function serverError() { return NextResponse.json({ error: "No se pudo completar la solicitud." }, { status: 500 }); }
export async function listTasks() {
  const auth = await authenticated(); if ("response" in auth) return auth.response;
  const { data, error } = await auth.repository.list(auth.userId);
  if (error) return serverError();
  return NextResponse.json({ tasks: data });
}
export async function createTask(body: unknown) {
  const parsed = taskInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revisa los campos de la tarea.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const auth = await authenticated(); if ("response" in auth) return auth.response;
  const { data, error } = await auth.repository.create(auth.userId, parsed.data);
  if (error) return serverError();
  return NextResponse.json({ task: data }, { status: 201 });
}
export async function getTask(id: string) {
  if (!taskIdSchema.safeParse(id).success) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  const auth = await authenticated(); if ("response" in auth) return auth.response;
  const { data, error } = await auth.repository.get(auth.userId, id);
  if (error) return serverError();
  if (!data) return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });
  return NextResponse.json({ task: data });
}
export async function patchTask(id: string, body: unknown) {
  if (!taskIdSchema.safeParse(id).success) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  const parsed = taskPatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revisa los campos de la tarea.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const auth = await authenticated(); if ("response" in auth) return auth.response;
  const { data, error } = await auth.repository.update(auth.userId, id, parsed.data);
  if (error) return serverError();
  if (!data) return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });
  return NextResponse.json({ task: data });
}
export async function removeTask(id: string) {
  if (!taskIdSchema.safeParse(id).success) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  const auth = await authenticated(); if ("response" in auth) return auth.response;
  const { data, error } = await auth.repository.delete(auth.userId, id);
  if (error) return serverError();
  if (!data) return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
