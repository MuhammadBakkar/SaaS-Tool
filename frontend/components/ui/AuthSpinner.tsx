/** Inline spinner for auth screens (verify email, etc.). */
export function AuthSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div
        className="h-11 w-11 rounded-full border-2 border-zinc-200 border-t-zinc-900 motion-safe:animate-spin"
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label ? <p className="text-center text-sm text-zinc-600">{label}</p> : null}
    </div>
  );
}
