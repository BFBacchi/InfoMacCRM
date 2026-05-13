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
      <Toaster
        richColors
        closeButton
        position="top-center"
        offset={16}
        gap={10}
        toastOptions={{
          classNames: {
            toast:
              "font-sans shadow-lg border border-zinc-200/80 dark:border-zinc-700/80 min-h-[3rem] items-center",
            title: "font-medium text-zinc-900 dark:text-zinc-50",
            description: "text-zinc-600 dark:text-zinc-400",
            closeButton:
              "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 border-0 bg-transparent",
          },
        }}
      />
    </ThemeProvider>
  );
}
