import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

function key32(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim() ?? "";
  if (raw.length < 16) {
    throw new Error("ENCRYPTION_KEY must be at least 16 characters");
  }
  return scryptSync(raw, "ai-ads-saas", 32);
}

/** AES-256-GCM: base64(iv|ciphertext|tag) */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key32(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}

export function decryptSecret(encoded: string): string {
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(12, buf.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key32(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
