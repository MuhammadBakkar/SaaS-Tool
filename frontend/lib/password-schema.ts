import { z } from "zod";

/** Matches backend `registerSchema` / reset password rules. */
export const strongPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Add one uppercase letter (A–Z)")
  .regex(/[a-z]/, "Add one lowercase letter (a–z)")
  .regex(/[0-9]/, "Add one number (0–9)")
  .regex(/[^A-Za-z0-9]/, "Add one special character (e.g. !@#$%)");
