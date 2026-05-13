"use client";

import { cn } from "@/lib/cn";

type Btn<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  buttons: Btn<T>[];
  selected: T;
  onToggle: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({ buttons, selected, onToggle, className }: Props<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800",
        className,
      )}
    >
      {buttons.map((b) => (
        <button
          key={b.value}
          type="button"
          onClick={() => onToggle(b.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            selected === b.value
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/80 dark:hover:text-zinc-100",
          )}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
