import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-center text-xl font-semibold text-zinc-900">Forgot password</h1>
      <p className="mt-1 text-center text-sm text-zinc-600">
        Enter your email and we&apos;ll send a reset link if the account exists.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
