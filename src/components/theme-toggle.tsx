"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const modes = [
  { value: "system" as const, icon: Monitor, label: "Sistema" },
  { value: "light" as const, icon: Sun, label: "Claro" },
  { value: "dark" as const, icon: Moon, label: "Oscuro" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-[104px] rounded-lg bg-zinc-100 dark:bg-zinc-800" aria-hidden />;
  }

  return (
    <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={cn(
            "rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100",
            theme === value && "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
