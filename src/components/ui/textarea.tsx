import { cn } from "@/lib/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: boolean;
  errorMessage?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, errorMessage, className, id, ...props },
  ref,
) {
  return (
    <div className="w-full max-w-md">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={4}
        className={cn(
          "w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50",
          error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700",
          className,
        )}
        {...props}
      />
      {errorMessage ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
    </div>
  );
});
