"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

const LABELS: Record<string, string> = {
  dashboard: "Panel",
  tickets: "Tickets",
  warranty: "Garantías",
  batches: "Lotes devolución",
  technicians: "Técnicos",
  clients: "Clientes",
  reports: "Informes",
  settings: "Configuración",
  team: "Equipo",
  onboarding: "Perfil",
  new: "Nuevo",
};

/**
 * Migas de pan según la ruta actual (App Router).
 */
export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);

  if (segments.length === 0) return null;

  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = LABELS[seg] ?? (seg.length > 20 ? `${seg.slice(0, 8)}…` : seg);
    crumbs.push({ href: acc, label });
  }

  const linkClass =
    "inline-flex min-h-9 min-w-9 max-w-full items-center rounded-md px-2 py-1.5 text-sm text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:focus-visible:ring-offset-zinc-950";

  return (
    <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm" aria-label="Migas de pan">
      <Link href="/dashboard" className={linkClass}>
        Inicio
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex min-w-0 items-center gap-1">
          <span className="shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden>
            /
          </span>
          {i === crumbs.length - 1 ? (
            <span className="min-w-0 truncate px-2 py-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.label}</span>
          ) : (
            <Link href={c.href} className={cn(linkClass, "min-w-0 shrink")}>
              <span className="truncate">{c.label}</span>
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
