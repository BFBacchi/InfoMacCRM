import type { Metadata } from "next";
import { AppProviders } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "INFOMAC CRM — Field Service",
  description: "Gestión de tickets y garantías IT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
