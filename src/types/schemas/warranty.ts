import { z } from "zod";

const partEnum = z.enum(["pendiente", "recibida", "incorrecta", "devuelta"]);
const returnEnum = z.enum(["pendiente", "en_proceso", "completada"]);

export const warrantyUpdateSchema = z
  .object({
    id: z.string().uuid(),
    part_status: partEnum.optional(),
    part_photo_url: z.string().min(1).nullable().optional(),
    return_status: returnEnum.optional(),
    return_photo_url: z.string().min(1).nullable().optional(),
    return_remito_url: z.string().min(1).nullable().optional(),
    return_date: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.part_status === "recibida" && !data.part_photo_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Foto obligatoria para marcar repuesto recibido",
        path: ["part_photo_url"],
      });
    }
    if (data.return_status === "completada") {
      if (!data.return_photo_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Foto de devolución obligatoria",
          path: ["return_photo_url"],
        });
      }
      if (!data.return_remito_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Remito obligatorio",
          path: ["return_remito_url"],
        });
      }
    }
  });
