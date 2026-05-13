"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DemoCredentialsPanel } from "@/components/marketing/demo-credentials-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VStack } from "@/components/ui/stack";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-credentials";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { loginSchema } from "@/types/schemas/auth";
import type { z } from "zod";

type Form = z.infer<typeof loginSchema>;

const demoAdminEmail = DEMO_ACCOUNTS.find((a) => a.id === "admin")?.email ?? "admin@demo.infomac.local";

/**
 * Formulario de acceso con contraseña y envío de magic link.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [info, setInfo] = useState<string | null>(null);
  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const fillDemoAdmin = () => {
    setValue("email", demoAdminEmail, { shouldValidate: true, shouldDirty: true });
    setValue("password", DEMO_PASSWORD, { shouldValidate: true, shouldDirty: true });
    setInfo(null);
  };

  const onPassword = handleSubmit(async (values) => {
    setInfo(null);
    if (!values.password || values.password.length < 6) {
      setInfo("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setInfo(error.message);
      return;
    }
    router.replace(next);
    router.refresh();
  });

  const onMagic = handleSubmit(async (values) => {
    setInfo(null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setInfo(error.message);
      return;
    }
    setInfo("Revisá tu correo para el enlace mágico.");
  });

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-10">
      <Card padding="xl" radius="xl" className="w-full border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:border-zinc-800 dark:shadow-black/20">
        <VStack className="gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">INFOMAC CRM</p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Iniciar sesión</h1>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Correo y contraseña, o magic link al mismo correo. En demo podés rellenar la cuenta admin con un clic.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={fillDemoAdmin} className="border-dashed">
              <Sparkles className="h-4 w-4" aria-hidden />
              Usar cuenta admin demo
            </Button>
            <Button href="/" variant="tertiary" size="sm">
              Volver al inicio
            </Button>
          </div>

          <form onSubmit={onPassword}>
            <VStack className="gap-4">
              <Input id="email" label="Correo" type="email" autoComplete="email" {...register("email")} error={!!errors.email} errorMessage={errors.email?.message} />
              <Input
                id="password"
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                error={!!errors.password}
                errorMessage={errors.password?.message}
              />
              {info ? <Alert variant="warning">{info}</Alert> : null}
              <Button type="submit" variant="primary" loading={isSubmitting} fillWidth size="lg">
                Entrar
              </Button>
              <Button type="button" variant="secondary" loading={isSubmitting} fillWidth onClick={onMagic}>
                Enviar magic link
              </Button>
            </VStack>
          </form>

          <p className="text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Al continuar aceptás el uso de cookies de sesión.{" "}
            <Link href="/" className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
              Ver credenciales en la portada
            </Link>
            .
          </p>
        </VStack>
      </Card>

      <aside className="lg:pt-1" aria-labelledby="login-demo-heading">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/60 p-5 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 id="login-demo-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Credenciales de demostración
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Copiá o usá el botón “admin demo” en el formulario.</p>
          <div className="mt-4">
            <DemoCredentialsPanel showLoginLink={false} />
          </div>
        </div>
      </aside>
    </div>
  );
}
