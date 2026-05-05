import { z } from "zod";
import { passwordSchema } from "../../auth/dto/schemas.js";

const IANA_TZ = /^[A-Za-z_\/+-]{1,50}$/;
const LOCALES = ["en", "ur", "ar", "fr", "de", "es", "hi"] as const;

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  timezone: z.string().max(50).regex(IANA_TZ, "Invalid timezone").optional(),
  locale: z.enum(LOCALES).optional(),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: passwordSchema,
    confirm_password: z.string().min(1),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

export const changeEmailSchema = z.object({
  new_email: z.string().email().max(255),
  password: z.string().optional(),
});

export const verifyEmailChangeSchema = z.object({
  token: z.string().min(10),
});

export const deleteAccountSchema = z.object({
  password: z.string().optional(),
  confirmation: z.string().optional(),
});
