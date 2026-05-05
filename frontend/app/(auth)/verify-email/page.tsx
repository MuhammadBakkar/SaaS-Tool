import { Suspense } from "react";
import { VerifyEmailInner } from "./verify-inner";
import { AuthSpinner } from "@/components/ui/AuthSpinner";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthSpinner label="Loading…" />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
