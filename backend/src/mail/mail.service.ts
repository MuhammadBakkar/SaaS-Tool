import { Resend } from "resend";
import { logger } from "../lib/logger.js";

function client(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

function from(): string {
  const f = process.env.MAIL_FROM?.trim();
  if (!f) throw new Error("MAIL_FROM is not set");
  return f;
}

export async function sendVerificationEmail(
  email: string,
  name: string | null,
  verifyLink: string
): Promise<void> {
  const subject = "Verify your AI Ads Generator account";
  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <div style="height:40px;background:#e5e7eb;border-radius:8px;margin-bottom:24px"></div>
    <h1 style="font-size:22px">Confirm your email</h1>
    <p>Hi${name ? ` ${escapeHtml(name)}` : ""}, please verify your AI Ads Generator account.</p>
    <p style="margin:32px 0">
      <a href="${verifyLink}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Verify Email</a>
    </p>
    <p style="color:#6b7280;font-size:14px">This link expires in 24 hours.</p>
  </div>`;
  try {
    const response = await client().emails.send({ from: from(), to: email, subject, html });
    console.log("response verification email", response);
  } catch (e) {
    logger.error("[mail] verification", e);
    throw e;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  resetLink: string
): Promise<void> {
  const subject = "Reset your password";
  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="font-size:22px">Reset your password</h1>
    <p>Hi${name ? ` ${escapeHtml(name)}` : ""}, we received a request to reset your password.</p>
    <p style="margin:32px 0">
      <a href="${resetLink}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Reset Password</a>
    </p>
    <p style="color:#6b7280;font-size:14px">This link expires in 1 hour.</p>
    <p style="color:#9ca3af;font-size:13px">If you didn't request this, you can ignore this email.</p>
  </div>`;
  try {
    await client().emails.send({ from: from(), to: email, subject, html });
  } catch (e) {
    logger.error("[mail] password reset", e);
    throw e;
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string | null
): Promise<void> {
  const subject = "Welcome to AI Ads Generator!";
  const dashboard = `${process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/dashboard`;
  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="font-size:22px">Welcome${name ? `, ${escapeHtml(name)}` : ""}!</h1>
    <p>Your email is verified. You're ready to create AI-powered ads.</p>
    <p style="margin:32px 0">
      <a href="${dashboard}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Go to Dashboard</a>
    </p>
  </div>`;
  try {
    await client().emails.send({ from: from(), to: email, subject, html });
  } catch (e) {
    logger.error("[mail] welcome", e);
    throw e;
  }
}

export async function sendEmailChangeConfirmation(
  newEmail: string,
  name: string | null,
  confirmLink: string
): Promise<void> {
  const subject = "Confirm your new email — AI Ads Generator";
  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="font-size:22px">Confirm your new email address</h1>
    <p>Hi${name ? ` ${escapeHtml(name)}` : ""}, click the link below to confirm this email for your AI Ads Generator account.</p>
    <p style="margin:32px 0">
      <a href="${confirmLink}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Confirm new email</a>
    </p>
    <p style="color:#6b7280;font-size:14px">This link expires in 24 hours.</p>
  </div>`;
  try {
    await client().emails.send({ from: from(), to: newEmail, subject, html });
  } catch (e) {
    logger.error("[mail] email change confirm", e);
    throw e;
  }
}

export async function sendEmailChangeAlertToCurrent(
  currentEmail: string,
  name: string | null,
  requestedNewEmail: string
): Promise<void> {
  const subject = "Email change requested for your account";
  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="font-size:22px">Email change requested</h1>
    <p>Hi${name ? ` ${escapeHtml(name)}` : ""}, someone requested to change your account email to <strong>${escapeHtml(requestedNewEmail)}</strong>.</p>
    <p>If this wasn't you, contact support immediately.</p>
  </div>`;
  try {
    await client().emails.send({ from: from(), to: currentEmail, subject, html });
  } catch (e) {
    logger.error("[mail] email change alert", e);
    throw e;
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
