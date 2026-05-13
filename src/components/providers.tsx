"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

/**
 * Proveedores globales: tema (claro / oscuro / sistema) y toasts.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </ThemeProvider>
  );
}
