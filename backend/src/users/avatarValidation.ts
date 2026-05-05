import type { Express } from "express";
import { AppError } from "../utils/errorHandler.js";
import { HTTP_STATUS } from "../utils/response.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX = 5 * 1024 * 1024;

export function assertValidAvatarFile(file: Express.Multer.File | undefined): void {
  if (!file?.buffer) {
    throw new AppError("No file uploaded", HTTP_STATUS.BAD_REQUEST);
  }
  if (!ALLOWED.has(file.mimetype)) {
    throw new AppError("Invalid file type. Use JPEG, PNG, or WebP.", HTTP_STATUS.BAD_REQUEST);
  }
  if (file.size > MAX) {
    throw new AppError("File too large (max 5MB)", HTTP_STATUS.BAD_REQUEST);
  }
}
