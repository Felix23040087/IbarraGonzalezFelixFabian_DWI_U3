import { getTask, patchTask, removeTask } from "@/lib/services/tasks";
import { NextRequest } from "next/server";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Context) { return getTask((await params).id); }
export async function PATCH(request: NextRequest, { params }: Context) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }
  return patchTask((await params).id, body);
}
export async function DELETE(_request: NextRequest, { params }: Context) { return removeTask((await params).id); }
