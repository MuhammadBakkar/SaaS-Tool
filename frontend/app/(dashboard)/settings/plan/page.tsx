"use client";

import { PlanInfo } from "@/components/settings/PlanInfo";

export default function SettingsPlanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Plan</h1>
        <p className="mt-1 text-sm text-zinc-600">Usage and billing (Stripe coming soon).</p>
      </div>
      <PlanInfo />
    </div>
  );
}
