import { z } from "zod";

const taskTypeEnum = z.enum([
  "masterizacion",
  "reemplazo",
  "diagnostico",
  "relevamiento",
  "otro",
]);
const priorityEnum = z.enum(["standard", "incidencia", "critico"]);
const statusEnum = z.enum([
  "sin_asignar",
  "asignado",
  "en_curso",
  "cerrado_operativo",
  "cerrado_definitivo",
]);

export const ticketCreateSchema = z.object({
  client_id: z.string().uuid(),
  city: z.string().min(1),
  province: z.string().min(1),
  task_type: taskTypeEnum,
  description: z.string().min(3),
  priority: priorityEnum,
  sla_hours: z.coerce.number().min(1).max(720),
  notes: z.string().optional(),
});

export const ticketUpdateSchema = z.object({
  id: z.string().uuid(),
  status: statusEnum.optional(),
  technician_id: z.string().uuid().nullable().optional(),
  priority: priorityEnum.optional(),
  notes: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  attended_at: z.string().nullable().optional(),
  closed_at: z.string().nullable().optional(),
});

export type TicketCreateValues = z.infer<typeof ticketCreateSchema>;
