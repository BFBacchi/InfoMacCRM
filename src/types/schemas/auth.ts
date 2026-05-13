import { z } from "zod";

/** Esquema de login: contraseña siempre string (vacío si solo magic link). */
export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string(),
});

export const onboardingSchema = z.object({
  full_name: z.string().min(2, "Nombre requerido"),
  phone: z.string().min(6, "Teléfono requerido"),
  base_id: z.string().uuid("Selecciona una base"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
