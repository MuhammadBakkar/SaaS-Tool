import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { jwtAuthGuard } from "./auth.guard.js";
import { isGoogleOAuthEnabled } from "./strategies/google.strategy.js";
import {
  forgotPassword,
  finishGoogleLogin,
  getCurrentUser,
  login,
  logout,
  logoutAll,
  refreshToken,
  register,
  resetPassword,
  verifyEmail,
} from "./auth.service.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./dto/schemas.js";
import { validateBody } from "./dto/validate.js";
import {
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
} from "../common/guards/throttle.js";
import { successResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.js";
import type { GoogleUser } from "./auth.types.js";

const router = Router();

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice("Bearer ".length).trim();
  return null;
}

router.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { full_name, email, password } = req.body;
      const data = await register({ full_name, email, password });
      res
        .status(HTTP_STATUS.CREATED)
        .json(successResponse(SUCCESS_MESSAGES.CREATED, data, HTTP_STATUS.CREATED));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await verifyEmail(req.body.token, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await login(req.body, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

const googleNotConfigured = (_req: Request, res: Response) => {
  res.status(503).json({
    message:
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in .env, then restart the server.",
  });
};

router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  if (!isGoogleOAuthEnabled()) {
    return googleNotConfigured(req, res);
  }
  passport.authenticate("google", { scope: ["email", "profile"], session: false })(req, res, next);
});

const frontBase = () => process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:4200";

router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleOAuthEnabled()) {
      return googleNotConfigured(req, res);
    }
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontBase()}/login?error=google`,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = req.user as unknown as GoogleUser;
      const url = await finishGoogleLogin(g, req);
      res.redirect(url);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/google/failure", (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Google authentication failed" });
});

router.post(
  "/refresh",
  validateBody(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await refreshToken(req.body.refresh_token);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/logout",
  jwtAuthGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = bearer(req);
      if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Missing access token" });
      }
      const u = req.user!;
      const data = await logout(token, u.id);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/logout-all",
  jwtAuthGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const data = await logoutAll(u.id);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await forgotPassword(req.body.email, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await resetPassword(req.body.token, req.body.password);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/me",
  jwtAuthGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const data = await getCurrentUser(u.id);
      res.json(successResponse(SUCCESS_MESSAGES.FETCHED, data));
    } catch (e) {
      next(e);
    }
  }
);

export const authRouter = router;
