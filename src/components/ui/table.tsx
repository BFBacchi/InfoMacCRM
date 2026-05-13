import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type TableHeader = { key: string; content: ReactNode };

export type TableProps = {
  data: { headers: TableHeader[]; rows: ReactNode[][] };
  className?: string;
};

export function Table({ data, className }: TableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30",
        className,
      )}
    >
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
          <tr>
            {data.headers.map((h) => (
              <th
                key={h.key}
                className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 first:pl-4 last:pr-4 sm:px-4 dark:text-zinc-400"
              >
                {h.content}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-100 transition-colors last:border-b-0 hover:bg-zinc-50/80 dark:border-zinc-800/80 dark:hover:bg-zinc-800/35"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2.5 align-middle text-zinc-800 first:pl-4 last:pr-4 sm:px-4 dark:text-zinc-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
