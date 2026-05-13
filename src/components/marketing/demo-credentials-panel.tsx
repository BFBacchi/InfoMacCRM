"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-credentials";

type Props = {
  /** Enlace al formulario de acceso (solo si `showLoginLink`). */
  loginHref?: string;
  /** Ocultar el pie “Ir a iniciar sesión” (p. ej. en la página `/login`). */
  showLoginLink?: boolean;
  className?: string;
};

/**
 * Panel reutilizable: cuentas demo + copiar correo / contraseña.
 */
export function DemoCredentialsPanel({ loginHref = "/login", showLoginLink = true, className }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Entorno de demostración</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/85 dark:text-amber-200/80">
            Misma contraseña para todas las cuentas. Solo para desarrollo; no uses estos datos en producción.
          </p>
          <p className="mt-2 font-mono text-xs font-semibold tracking-wide text-amber-950 dark:text-amber-50">{DEMO_PASSWORD}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2 border-amber-300/80 bg-white/80 hover:bg-white dark:border-amber-800 dark:bg-zinc-900/80"
            onClick={() => void copy("pwd", DEMO_PASSWORD)}
          >
            {copied === "pwd" ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                Contraseña copiada
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                Copiar contraseña
              </>
            )}
          </Button>
        </div>
      </div>

      <ul className="space-y-3" aria-label="Cuentas de demostración">
        {DEMO_ACCOUNTS.map((acc) => (
          <li key={acc.id}>
            <Card
              padding="m"
              radius="l"
              className={cn(
                "border transition-shadow",
                acc.highlight
                  ? "border-blue-200/90 bg-gradient-to-br from-white to-blue-50/60 shadow-md shadow-blue-900/5 dark:border-blue-900/60 dark:from-zinc-900 dark:to-blue-950/20"
                  : "border-zinc-200/90 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50",
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{acc.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{acc.description}</p>
                  <p className="mt-2 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">{acc.email}</p>
                </div>
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  className="shrink-0 self-start sm:self-center"
                  onClick={() => void copy(`email-${acc.id}`, acc.email)}
                >
                  {copied === `email-${acc.id}` ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden />
                      Copiar correo
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {showLoginLink ? (
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          ¿Ya tenés las credenciales?{" "}
          <a href={loginHref} className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
            Ir a iniciar sesión
          </a>
        </p>
      ) : null}
    </div>
  );
}
