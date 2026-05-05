import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { jwtAuthGuard } from "../auth/auth.guard.js";
import { validateBody } from "../auth/dto/validate.js";
import { errorResponse, successResponse, SUCCESS_MESSAGES, HTTP_STATUS } from "../utils/response.js";
import {
  changeEmailLimiter,
  changePasswordLimiter,
  deleteAccountLimiter,
} from "../common/guards/throttle.js";
import { assertValidAvatarFile } from "./avatarValidation.js";
import {
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
  verifyEmailChangeSchema,
} from "./dto/schemas.js";
import * as usersService from "./users.service.js";

const router = Router();

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

router.use(jwtAuthGuard);

router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = req.user!;
    const data = await usersService.getProfile(u.id);
    res.json(successResponse(SUCCESS_MESSAGES.FETCHED, data));
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/me/profile",
  validateBody(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const data = await usersService.updateProfile(u.id, req.body, req);
      res.json(successResponse(SUCCESS_MESSAGES.UPDATED, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/me/avatar",
  uploadMemory.single("avatar"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      assertValidAvatarFile(req.file);
      const data = await usersService.uploadUserAvatar(u.id, req.file!, req);
      res.json(successResponse(SUCCESS_MESSAGES.UPDATED, data));
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/me/avatar", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = req.user!;
    const data = await usersService.removeUserAvatar(u.id, req);
    res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/me/change-password",
  changePasswordLimiter,
  validateBody(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const data = await usersService.changePassword(u.id, req.body, u.sessionId, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.get("/me/sessions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = req.user!;
    const data = await usersService.getActiveSessions(u.id, u.sessionId);
    res.json(successResponse(SUCCESS_MESSAGES.FETCHED, data));
  } catch (e) {
    next(e);
  }
});

router.delete("/me/sessions/all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = req.user!;
    const data = await usersService.revokeAllOtherSessions(u.id, u.sessionId, req);
    res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
  } catch (e) {
    next(e);
  }
});

router.delete(
  "/me/sessions/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const sid = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
      if (!sid) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Missing session id", HTTP_STATUS.BAD_REQUEST));
      }
      const data = await usersService.revokeSession(u.id, sid, u.sessionId, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/me/change-email",
  changeEmailLimiter,
  validateBody(changeEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const data = await usersService.requestEmailChange(u.id, req.body, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/me/verify-email-change",
  validateBody(verifyEmailChangeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const data = await usersService.verifyEmailChange(u.id, req.body, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

router.get("/me/plan", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = req.user!;
    const data = await usersService.getPlanSummary(u.id);
    res.json(successResponse(SUCCESS_MESSAGES.FETCHED, data));
  } catch (e) {
    next(e);
  }
});

router.delete(
  "/me/account",
  deleteAccountLimiter,
  validateBody(deleteAccountSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = req.user!;
      const data = await usersService.deleteAccount(u.id, req.body, req);
      res.json(successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, data));
    } catch (e) {
      next(e);
    }
  }
);

export const usersRouter = router;
