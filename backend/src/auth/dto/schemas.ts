import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email().max(255),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((d: any) => d.password === d.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember_me: z.boolean().optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});
