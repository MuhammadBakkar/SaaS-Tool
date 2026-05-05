"use client";

import { ChangeEmailForm } from "@/components/settings/ChangeEmailForm";

export default function SettingsEmailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Email</h1>
        <p className="mt-1 text-sm text-zinc-600">Change the email you use to sign in.</p>
      </div>
      <ChangeEmailForm />
    </div>
  );
}
