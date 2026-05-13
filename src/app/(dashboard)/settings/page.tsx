import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createBaseAction,
  createClientAction,
  toggleNotificationSettingAction,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assertRole } from "@/lib/auth/assert-role";
import { getCurrentProfile } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const selectClass =
  "mt-1 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

/**
 * Configuración administrativa: bases, clientes y disparadores de notificación.
 * La gestión de coordinadores/técnicos está en `/settings/team` (solo superusuario).
 */
export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertRole(profile, ["admin"]);

  const supabase = await createServerSupabaseClient();
  const { data: bases } = await supabase.from("bases").select("*").order("name");
  const { data: clients } = await supabase.from("clients").select("*").order("name");
  const { data: notif } = await supabase.from("notification_settings").select("*").order("key");

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Configuración</h1>

      {profile.is_superuser ? (
        <Card padding="m" radius="l" className="w-full border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-sm text-zinc-800 dark:text-zinc-200">
            Coordinadores y técnicos: altas, edición y bajas en{" "}
            <Link href="/settings/team" className="font-semibold text-blue-700 underline dark:text-blue-400">
              Equipo
            </Link>
            .
          </p>
        </Card>
      ) : null}

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Bases</h2>
        <form action={createBaseAction}>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <Input id="b-name" name="name" label="Nombre" required />
            <Input id="b-city" name="city" label="Ciudad" required />
            <Input id="b-prov" name="province" label="Provincia" required />
            <div className="flex min-w-[140px] flex-col">
              <span className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</span>
              <select name="type" defaultValue="infomac" className={selectClass}>
                <option value="infomac">INFOMAC</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <Input id="b-lat" name="lat" label="Lat" type="number" step="any" />
            <Input id="b-lng" name="lng" label="Lng" type="number" step="any" />
            <Button type="submit" variant="primary">
              Agregar base
            </Button>
          </div>
        </form>
        <ul className="mt-4 flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {(bases ?? []).map((b) => (
            <li key={b.id}>
              {b.name} — {b.city} ({b.type})
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Clientes</h2>
        <form action={createClientAction}>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <Input id="c-name" name="name" label="Nombre" required />
            <div className="flex min-w-[140px] flex-col">
              <span className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</span>
              <select name="type" defaultValue="other" className={selectClass}>
                <option value="dell">Dell</option>
                <option value="lenovo">Lenovo</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <Input id="c-sla" name="sla_hours" label="SLA horas" type="number" defaultValue={48} />
            <Button type="submit" variant="primary">
              Agregar cliente
            </Button>
          </div>
        </form>
        <ul className="mt-4 flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {(clients ?? []).map((c) => (
            <li key={c.id}>
              {c.name} — SLA {c.sla_hours}h ({c.type})
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Disparadores de notificación</h2>
        <div className="mt-4 flex flex-col gap-3">
          {(notif ?? []).map((n) => (
            <form
              key={n.key}
              action={toggleNotificationSettingAction}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
            >
              <input type="hidden" name="key" value={n.key} />
              <input type="hidden" name="enabled" value={String(!n.enabled)} />
              <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{n.key}</span>
              <Button size="sm" variant="secondary" type="submit">
                {n.enabled ? "Desactivar" : "Activar"}
              </Button>
            </form>
          ))}
        </div>
      </Card>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Las claves de Google Maps deben configurarse solo en variables de entorno (Vercel / Supabase), nunca en la UI.
      </p>
    </div>
  );
}
