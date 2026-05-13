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

const partsReceivedEnum = z.enum(["recibida", "pendiente", "no_aplica"]);

export const ticketCreateSchema = z.object({
  client_id: z.string().uuid(),
  city: z.string().min(1),
  province: z.string().min(1),
  base_infomac_id: z.string().uuid({ message: "Seleccioná una base INFOMAC" }),
  task_type: taskTypeEnum,
  description: z.string().min(3, "La descripción o escenario debe tener al menos 3 caracteres"),
  equipment_model: z.string().max(300),
  end_user_location: z.string().max(600),
  priority: priorityEnum,
  sla_hours: z.coerce.number().min(1).max(720),
  notes: z.string(),
  parts_received_status: partsReceivedEnum,
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
  description: z.string().min(3).optional(),
  equipment_model: z.string().max(300).nullable().optional(),
  end_user_location: z.string().max(600).nullable().optional(),
  action_taken: z.string().max(4000).nullable().optional(),
  base_infomac_id: z.string().uuid().nullable().optional(),
  parts_received_status: partsReceivedEnum.optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
});

export type TicketCreateValues = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateValues = z.infer<typeof ticketUpdateSchema>;

/** Formulario de ficha en detalle de ticket (guardado conjunto). */
export const ticketEditFormSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(3, "Descripción / escenario requerido"),
  equipment_model: z.string().max(300),
  end_user_location: z.string().max(600),
  action_taken: z.string().max(4000),
  notes: z.string().max(4000).optional(),
  base_infomac_id: z.string().uuid({ message: "Seleccioná una base INFOMAC" }),
  parts_received_status: partsReceivedEnum,
  city: z.string().min(1),
  province: z.string().min(1),
});

export type TicketEditFormValues = z.infer<typeof ticketEditFormSchema>;
