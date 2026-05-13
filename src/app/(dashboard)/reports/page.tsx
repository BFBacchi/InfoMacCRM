import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { assertRole } from "@/lib/auth/assert-role";
import { getCurrentProfile } from "@/lib/auth/session";

/**
 * Informes y enlaces de exportación.
 */
export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertRole(profile, ["admin", "coordinator"]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Informes</h1>
      <div className="flex flex-wrap gap-4">
        <Card padding="m" radius="m" className="w-full max-w-xs">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tickets CSV</h2>
            <Button href="/api/export/tickets?format=csv" variant="secondary">
              Descargar
            </Button>
          </div>
        </Card>
        <Card padding="m" radius="m" className="w-full max-w-xs">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tickets Excel</h2>
            <Button href="/api/export/tickets?format=xlsx" variant="secondary">
              Descargar
            </Button>
          </div>
        </Card>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Los informes SLA mensual y rendimiento por técnico usan los mismos datos exportables; filtrá en Excel o BI.
      </p>
    </div>
  );
}
