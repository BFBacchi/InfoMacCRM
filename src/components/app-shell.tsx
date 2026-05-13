"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardBreadcrumbs } from "@/components/dashboard/dashboard-breadcrumbs";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { VStack } from "@/components/ui/stack";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { cn } from "@/lib/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

type NavItem = { href: string; label: string; roles: Array<Profile["role"]>; requireSuperuser?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Panel", roles: ["admin", "coordinator", "technician"] },
  { href: "/tickets", label: "Tickets", roles: ["admin", "coordinator", "technician"] },
  { href: "/warranty/batches", label: "Lotes devolución", roles: ["admin", "coordinator"] },
  { href: "/technicians", label: "Técnicos", roles: ["admin", "coordinator"] },
  { href: "/clients", label: "Clientes", roles: ["admin", "coordinator"] },
  { href: "/reports", label: "Informes", roles: ["admin", "coordinator"] },
  { href: "/settings/team", label: "Equipo", roles: ["admin"], requireSuperuser: true },
  { href: "/settings", label: "Configuración", roles: ["admin"] },
];

type Props = {
  profile: Profile;
  children: React.ReactNode;
  breadcrumbs?: React.ReactNode;
};

/**
 * Layout principal CRM: barra lateral, cabecera, campana de notificaciones y área de contenido.
 */
export function AppShell({ profile, children, breadcrumbs }: Props) {
  const pathname = usePathname();
  const items = useMemo(
    () =>
      NAV.filter(
        (n) => n.roles.includes(profile.role) && (!n.requireSuperuser || profile.is_superuser),
      ),
    [profile.role, profile.is_superuser],
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<
    { id: string; message: string; read: boolean; created_at: string; ticket_id: string | null }[]
  >([]);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const loadNotifs = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, message, read, created_at, ticket_id")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifs(data ?? []);
  }, [profile.id, supabase]);

  useEffect(() => {
    void loadNotifs();
  }, [loadNotifs]);

  useRealtimeNotifications(supabase, profile.id, loadNotifs);

  const unread = notifs.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    void loadNotifs();
  };

  return (
    <div className="flex min-h-dvh w-full">
      <aside className="flex w-[260px] shrink-0 flex-col gap-4 border-r border-zinc-200 bg-zinc-100 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">INFOMAC CRM</h2>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const selected =
              pathname === item.href ||
              (pathname.startsWith(`${item.href}/`) && !(item.href === "/settings" && pathname !== "/settings"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                  selected && "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {profile.full_name} · {profile.role}
            </p>
            {breadcrumbs ?? <DashboardBreadcrumbs />}
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              title={`Notificaciones${unread ? ` (${unread})` : ""}`}
              aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}
              onClick={() => setNotifOpen(true)}
              className="rounded-lg border border-zinc-200 bg-white p-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Bell className="h-5 w-5" />
            </button>
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-w-[1.125rem] items-center justify-center rounded-md bg-red-600 px-1 text-[10px] font-semibold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </div>
        </div>
        <hr className="border-zinc-200 dark:border-zinc-800" />
        <div className="min-h-0 flex-1">{children}</div>
      </div>

      <Modal isOpen={notifOpen} onClose={() => setNotifOpen(false)} title="Notificaciones">
        <VStack className="gap-3">
          {notifs.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No hay notificaciones.</p>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{n.message}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(n.created_at).toLocaleString("es-AR")}
                  </p>
                  {n.ticket_id ? (
                    <Link
                      href={`/tickets/${n.ticket_id}`}
                      className="inline-block rounded-md px-1 py-0.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      Ver ticket
                    </Link>
                  ) : null}
                </div>
                {!n.read ? (
                  <Button size="xs" variant="secondary" onClick={() => void markRead(n.id)}>
                    Marcar leída
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </VStack>
      </Modal>
    </div>
  );
}
