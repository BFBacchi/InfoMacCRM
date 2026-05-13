export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-zinc-100 px-4 py-10 sm:px-6 dark:bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(59,130,246,0.08),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 flex w-full max-w-5xl flex-1 flex-col justify-center py-4">{children}</div>
    </div>
  );
}
