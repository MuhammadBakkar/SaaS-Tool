import { Suspense } from "react";
import { OAuthCallbackInner } from "./callback-inner";

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-sm text-zinc-600">Completing sign-in…</p>}
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
