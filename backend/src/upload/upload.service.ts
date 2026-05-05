import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../utils/errorHandler.js";
import { HTTP_STATUS } from "../utils/response.js";
import { logger } from "../lib/logger.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function configureCloudinary(): void {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
    );
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
}

function avatarFolder(): string {
  return (process.env.CLOUDINARY_AVATAR_FOLDER ?? "ai-ads-generator/avatars").replace(
    /^\/+|\/+$/g,
    ""
  );
}

function maxAvatarBytes(): number {
  const mb = Number.parseFloat(process.env.MAX_AVATAR_SIZE_MB ?? "5");
  const n = Number.isFinite(mb) && mb > 0 ? mb : 5;
  return Math.floor(n * 1024 * 1024);
}

export async function uploadAvatar(
  file: Express.Multer.File,
  userId: string
): Promise<string> {
  configureCloudinary();
  if (!ALLOWED.has(file.mimetype)) {
    throw new AppError("Invalid file type", HTTP_STATUS.BAD_REQUEST);
  }
  if (file.size > maxAvatarBytes()) {
    throw new AppError("File too large", HTTP_STATUS.BAD_REQUEST);
  }

  const folder = avatarFolder();
  const public_id = `avatar_${userId}`;

  const secure_url = await new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id,
        resource_type: "image",
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
        ],
      },
      (err, result) => {
        if (err || !result?.secure_url) {
          reject(err ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    Readable.from(file.buffer).pipe(uploadStream);
  }).catch((e: unknown) => {
    logger.error("[upload] Cloudinary upload", e);
    throw new AppError("Avatar upload failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  return secure_url;
}

export async function deleteAvatar(userId: string): Promise<void> {
  try {
    configureCloudinary();
  } catch {
    return;
  }
  const folder = avatarFolder();
  const public_id = `${folder}/avatar_${userId}`;
  try {
    const r = await cloudinary.uploader.destroy(public_id, { resource_type: "image" });
    if (r.result === "not found") {
      return;
    }
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "http_code" in e ? String((e as { http_code?: number }).http_code) : "";
    if (msg === "404") {
      return;
    }
    logger.warn("[upload] deleteAvatar", e);
  }
}
