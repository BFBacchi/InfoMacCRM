import { redirect } from "next/navigation";
import { toggleTechnicianForm } from "@/app/(dashboard)/technicians/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { assertRole } from "@/lib/auth/assert-role";
import { getCurrentProfile } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Directorio de técnicos con carga de trabajo aproximada.
 */
export default async function TechniciansPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertRole(profile, ["admin", "coordinator"]);

  const supabase = await createServerSupabaseClient();
  const { data: techs } = await supabase.from("technicians").select("id, profile_id, specialty, availability, base_id");
  const profileIds = [...new Set((techs ?? []).map((t) => t.profile_id))];
  let profiles: { id: string; full_name: string; email: string }[] = [];
  if (profileIds.length) {
    const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", profileIds);
    profiles = data ?? [];
  }
  const profBy = new Map(profiles.map((p) => [p.id, p]));
  const { data: tickets } = await supabase.from("tickets").select("id, technician_id, status");
  const open = ["sin_asignar", "asignado", "en_curso"];
  const load = (tid: string | null) =>
    (tickets ?? []).filter((t) => t.technician_id === tid && open.includes(t.status)).length;

  const headers = [
    { key: "n", content: "Nombre" },
    { key: "e", content: "Correo" },
    { key: "s", content: "Especialidad" },
    { key: "a", content: "Disponible" },
    { key: "w", content: "Tickets abiertos" },
    { key: "x", content: "Acción" },
  ];

  const rows =
    techs?.map((t) => {
      const p = profBy.get(t.profile_id);
      return [
        <span key={`${t.id}-n`} className="text-sm">
          {p?.full_name ?? "—"}
        </span>,
        <span key={`${t.id}-e`} className="text-sm">
          {p?.email ?? "—"}
        </span>,
        <span key={`${t.id}-s`} className="text-sm">
          {t.specialty ?? "—"}
        </span>,
        <Badge key={`${t.id}-a`}>{t.availability ? "Sí" : "No"}</Badge>,
        <span key={`${t.id}-w`} className="text-sm">
          {String(load(t.id))}
        </span>,
        <form key={`${t.id}-form`} action={toggleTechnicianForm}>
          <input type="hidden" name="id" value={t.id} />
          <input type="hidden" name="availability" value={String(!t.availability)} />
          <Button size="sm" variant="secondary" type="submit">
            {t.availability ? "Desactivar" : "Activar"}
          </Button>
        </form>,
      ];
    }) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Técnicos</h1>
      <Card padding="m" radius="m" className="w-full">
        <Table data={{ headers, rows }} className="w-full" />
      </Card>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Mapa en vivo: próxima iteración con coordenadas de tickets y bases.
      </p>
    </div>
  );
}
