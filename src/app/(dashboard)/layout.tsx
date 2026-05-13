import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProfileGate } from "@/components/profile-gate";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <AppShell profile={profile}>
      <ProfileGate profile={profile}>{children}</ProfileGate>
    </AppShell>
  );
}
