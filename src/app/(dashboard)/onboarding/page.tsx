import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

/**
 * Completar perfil (nombre, teléfono, base) y opcionalmente avatar.
 */
export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const complete =
    profile.full_name?.trim() && profile.phone?.trim() && profile.base_id;
  if (complete) redirect("/dashboard");

  const supabase = await createServerSupabaseClient();
  const { data: bases } = await supabase.from("bases").select("id, name, city, province").order("name");

  return <OnboardingForm profile={profile} bases={bases ?? []} />;
}
