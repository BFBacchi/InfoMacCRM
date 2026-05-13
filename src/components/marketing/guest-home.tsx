import Link from "next/link";
import { DemoCredentialsPanel } from "@/components/marketing/demo-credentials-panel";
import { Button } from "@/components/ui/button";

/**
 * Página de bienvenida para visitantes: marca, credenciales demo y acceso al login.
 */
export function GuestHome() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23918196' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-12 pt-10 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-16">
        <div className="mb-10 flex-1 lg:mb-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Field service</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            INFOMAC <span className="text-blue-600 dark:text-blue-400">CRM</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Tickets, SLA, garantías y equipo en un solo lugar. Probá el entorno demo sin configurar nada.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/login" variant="primary" size="lg" className="min-w-[180px] shadow-lg shadow-blue-600/25">
              Iniciar sesión
            </Button>
            <a
              href="#acceso-demo"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              Ver credenciales demo
            </a>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
            {["Panel operativo y métricas", "Kanban y tabla de tickets", "Garantías y devoluciones"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div id="acceso-demo" className="w-full flex-1 scroll-mt-24 lg:max-w-md">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/20">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Acceso de demostración</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Copiá un correo y la contraseña, luego iniciá sesión.</p>
            <div className="mt-6">
              <DemoCredentialsPanel loginHref="/login" />
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Al iniciar sesión aceptás cookies de sesión.{" "}
            <Link href="/login" className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400">
              Continuar
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
