import { redirect } from "next/navigation";
import { TeamManagement } from "@/components/settings/team-management";
import { assertSuperuser } from "@/lib/auth/assert-super";
import { getCurrentProfile } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TeamRow = {
  id: string;
  email: string;
  full_name: string;
  role: "coordinator" | "technician";
  base_id: string | null;
  phone: string | null;
  technician_id: string | null;
  specialty: string | null;
  availability: boolean | null;
};

/**
 * CRUD de coordinadores y técnicos (solo superusuario).
 */
export default async function TeamSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertSuperuser(profile);

  const supabase = await createServerSupabaseClient();
  const [{ data: profiles }, { data: bases }, { data: techs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, base_id, phone")
      .in("role", ["coordinator", "technician"])
      .order("role", { ascending: true })
      .order("email", { ascending: true }),
    supabase.from("bases").select("id, name").order("name"),
    supabase.from("technicians").select("id, profile_id, specialty, availability"),
  ]);

  const techByProfile = new Map((techs ?? []).map((t) => [t.profile_id, t]));

  const rows: TeamRow[] = (profiles ?? []).map((p) => {
    const tech = techByProfile.get(p.id);
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role as "coordinator" | "technician",
      base_id: p.base_id,
      phone: p.phone,
      technician_id: tech?.id ?? null,
      specialty: tech?.specialty ?? null,
      availability: tech?.availability ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Equipo</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Coordinadores y técnicos. Solo el superusuario puede crear, editar o eliminar cuentas.
        </p>
      </div>
      <TeamManagement initialRows={rows} bases={bases ?? []} />
    </div>
  );
}
