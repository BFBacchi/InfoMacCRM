"use client";

import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:active:bg-blue-700",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:active:bg-zinc-600",
  tertiary:
    "text-blue-700 hover:bg-blue-50 active:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950/50 dark:active:bg-blue-950",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
} as const;

const sizes = {
  xs: "min-h-8 px-2 py-1 text-xs",
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-11 px-5 py-2.5 text-base",
} as const;

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

type Common = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fillWidth?: boolean;
  href?: string;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>;

export function Button({
  variant = "primary",
  size = "md",
  loading,
  fillWidth,
  href,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[color,background-color,border-color,transform,opacity] motion-safe:active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    fillWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading ? <Spinner /> : null}
      {children}
    </>
  );

  if (href) {
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return <Link href={href} className={classes}>{content}</Link>;
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
