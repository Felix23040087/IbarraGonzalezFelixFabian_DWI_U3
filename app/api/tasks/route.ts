import { createTask, listTasks } from "@/lib/services/tasks";
import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() { return listTasks(); }
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }
  return createTask(body);
}
