import { z } from "zod";

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(160),
  description: z.string().trim().max(2000).nullable().optional().transform((value) => value || null),
  priority: z.enum(["baja", "media", "alta"]).default("media"),
  due_date: z.string().date().nullable().optional().transform((value) => value || null),
  status: z.enum(["pendiente", "completada"]).optional(),
}).strict();
export const taskPatchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(["baja", "media", "alta"]).optional(),
  due_date: z.string().date().nullable().optional(),
  status: z.enum(["pendiente", "completada"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo.");
export const taskIdSchema = z.string().uuid();
export type TaskInput = z.infer<typeof taskInputSchema>;
