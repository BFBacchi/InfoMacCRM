/**
 * Credenciales de demostración (seed `npm run db:seed`).
 * No usar en producción con datos reales.
 */
export const DEMO_PASSWORD = "Demo1234!";

export const DEMO_ACCOUNTS = [
  {
    id: "admin",
    label: "Superusuario / Admin",
    description: "Configuración, equipo, bases y notificaciones.",
    email: "admin@demo.infomac.local",
    highlight: true,
  },
  {
    id: "coord",
    label: "Coordinador",
    description: "Tickets, clientes, informes y asignaciones.",
    email: "coord1@demo.infomac.local",
    highlight: false,
  },
  {
    id: "tech",
    label: "Técnico",
    description: "Tickets asignados y campo.",
    email: "tech1@demo.infomac.local",
    highlight: false,
  },
] as const;
