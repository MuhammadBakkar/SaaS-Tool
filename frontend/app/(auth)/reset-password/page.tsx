import { Suspense } from "react";
import { ResetPasswordInner } from "./reset-inner";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-sm text-zinc-600">Loading…</p>}
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
