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
    "rounded-md px-1.5 py-0.5 text-sm text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40";

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Migas de pan">
      <Link href="/dashboard" className={linkClass}>
        Inicio
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          <span className="text-zinc-400">/</span>
          {i === crumbs.length - 1 ? (
            <span className="px-1.5 py-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.label}</span>
          ) : (
            <Link href={c.href} className={cn(linkClass)}>
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
