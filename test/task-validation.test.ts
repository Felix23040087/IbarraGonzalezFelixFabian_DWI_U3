import { describe, expect, it } from "vitest";
import { taskInputSchema, taskPatchSchema, taskIdSchema } from "@/lib/validation/task";

describe("validación de tareas", () => {
  it("acepta y normaliza una tarea válida", () => {
    expect(taskInputSchema.parse({ title: "  Entregar proyecto  ", priority: "alta", description: "" })).toMatchObject({ title: "Entregar proyecto", priority: "alta", description: null, due_date: null });
  });
  it("rechaza títulos vacíos y prioridades fuera del catálogo", () => {
    expect(taskInputSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(taskInputSchema.safeParse({ title: "Tarea", priority: "urgente" }).success).toBe(false);
  });
  it("valida IDs UUID y actualizaciones no vacías", () => {
    expect(taskIdSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(taskPatchSchema.safeParse({}).success).toBe(false);
    expect(taskPatchSchema.safeParse({ status: "completada" }).success).toBe(true);
  });
});
