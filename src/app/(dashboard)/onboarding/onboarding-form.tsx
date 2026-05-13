"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { VStack } from "@/components/ui/stack";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { onboardingSchema, type OnboardingFormValues } from "@/types/schemas/auth";

type BaseRow = { id: string; name: string; city: string; province: string };

type Props = {
  profile: Profile;
  bases: BaseRow[];
};

/**
 * Formulario de primer acceso: datos personales, base y avatar opcional.
 */
export function OnboardingForm({ profile, bases }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      base_id: profile.base_id ?? "",
    },
  });

  const baseId = watch("base_id");

  const baseOptions = bases.map((b) => ({
    value: b.id,
    label: `${b.name} — ${b.city}, ${b.province}`,
  }));

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida.");
      return;
    }

    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      const path = `${user.id}/${Date.now()}-${avatarFile.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, {
        upsert: true,
      });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      avatar_url = pub.publicUrl;
    }

    const { error: upProfile } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name,
        phone: values.phone,
        base_id: values.base_id,
        avatar_url,
      })
      .eq("id", user.id);

    if (upProfile) {
      setError(upProfile.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <Card padding="xl" radius="l" className="w-full max-w-md">
      <VStack className="gap-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Completá tu perfil</h1>
        <form onSubmit={onSubmit}>
          <VStack className="gap-4">
            <Input
              id="full_name"
              label="Nombre completo"
              {...register("full_name")}
              error={!!errors.full_name}
              errorMessage={errors.full_name?.message}
            />
            <Input
              id="phone"
              label="Teléfono"
              {...register("phone")}
              error={!!errors.phone}
              errorMessage={errors.phone?.message}
            />
            <FormSelect
              id="base_id"
              label="Base asignada"
              options={baseOptions}
              value={baseId}
              onSelect={(v) => setValue("base_id", String(v), { shouldValidate: true })}
              error={!!errors.base_id}
              errorMessage={errors.base_id?.message}
            />
            <div className="space-y-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Avatar (opcional)</span>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 file:text-sm dark:text-zinc-400 dark:file:bg-zinc-800"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <Button type="submit" variant="primary" loading={isSubmitting} fillWidth>
              Guardar y continuar
            </Button>
          </VStack>
        </form>
      </VStack>
    </Card>
  );
}
