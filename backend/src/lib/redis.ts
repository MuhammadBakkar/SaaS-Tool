import { Redis } from "ioredis";
import { logger } from "./logger.js";

/** In-process TTL map when Redis is off or unreachable (JWT blocklist still works per server). */
const memory = new Map<string, { value: string; expiresAt: number }>();

function memoryGet(key: string): string | null {
  const row = memory.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    memory.delete(key);
    return null;
  }
  return row.value;
}

function memorySetEx(key: string, ttlSeconds: number, value: string): void {
  memory.set(key, { value, expiresAt: Date.now() + Math.max(1, ttlSeconds) * 1000 });
}

function memoryDel(key: string): void {
  memory.delete(key);
}

function redisExplicitlyOff(): boolean {
  return !process.env.REDIS_URL?.trim() || process.env.REDIS_DISABLED === "true";
}

/** True when Redis is down or the TCP client is no longer usable (ioredis / OS errors). */
function isRedisUnreachable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as NodeJS.ErrnoException & { code?: string; message?: string };
  const msg = e.message ?? "";
  return (
    e.code === "ECONNREFUSED" ||
    e.code === "ENOTFOUND" ||
    e.code === "ETIMEDOUT" ||
    e.code === "ECONNRESET" ||
    e.code === "EPIPE" ||
    e.code === "NR_CLOSED" ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("Connection is closed") ||
    msg.includes("The connection is already closed")
  );
}

let ioClient: Redis | null = null;
let useMemory = redisExplicitlyOff();

function getIo(): Redis {
  if (useMemory) {
    throw new Error("[redis] internal: getIo called in memory mode");
  }
  if (!ioClient) {
    const url = process.env.REDIS_URL!.trim();
    ioClient = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      connectTimeout: 10_000,
      retryStrategy(attempt) {
        if (attempt > 10) return null;
        return Math.min(attempt * 200, 3000);
      },
    });
    ioClient.on("error", (err: Error) => logger.error("[redis]", err));
  }
  return ioClient;
}

function resetRedisClient(): void {
  if (!ioClient) return;
  try {
    ioClient.disconnect();
  } catch {
    /* ignore */
  }
  ioClient = null;
}

async function switchToMemory(reason: string): Promise<void> {
  if (useMemory) return;
  logger.warn(`[redis] ${reason} — using in-memory store (JWT blocklist is per-process only).`);
  useMemory = true;
  resetRedisClient();
}

export async function redisSetWithTtl(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  if (useMemory) {
    memorySetEx(key, ttlSeconds, value);
    return;
  }
  try {
    const r = getIo();
    if (ttlSeconds > 0) {
      await r.set(key, value, "EX", ttlSeconds);
    } else {
      await r.set(key, value);
    }
  } catch (err) {
    if (!isRedisUnreachable(err)) throw err;
    resetRedisClient();
    try {
      const r = getIo();
      if (ttlSeconds > 0) {
        await r.set(key, value, "EX", ttlSeconds);
      } else {
        await r.set(key, value);
      }
    } catch (err2) {
      if (isRedisUnreachable(err2)) {
        await switchToMemory("Redis unreachable");
        memorySetEx(key, ttlSeconds, value);
        return;
      }
      throw err2;
    }
  }
}

export async function redisGet(key: string): Promise<string | null> {
  if (useMemory) {
    return memoryGet(key);
  }
  try {
    return await getIo().get(key);
  } catch (err) {
    if (!isRedisUnreachable(err)) throw err;
    resetRedisClient();
    try {
      return await getIo().get(key);
    } catch (err2) {
      if (isRedisUnreachable(err2)) {
        await switchToMemory("Redis unreachable");
        return memoryGet(key);
      }
      throw err2;
    }
  }
}

export async function redisDel(key: string): Promise<void> {
  if (useMemory) {
    memoryDel(key);
    return;
  }
  try {
    await getIo().del(key);
  } catch (err) {
    if (!isRedisUnreachable(err)) throw err;
    resetRedisClient();
    try {
      await getIo().del(key);
    } catch (err2) {
      if (isRedisUnreachable(err2)) {
        await switchToMemory("Redis unreachable");
        memoryDel(key);
        return;
      }
      throw err2;
    }
  }
}

/** @deprecated Prefer {@link redisGet} / {@link redisSetWithTtl}. Exposed for rare direct access. */
export function getRedis(): Redis {
  if (useMemory || redisExplicitlyOff()) {
    throw new Error(
      "Redis is in memory mode or disabled. Use redisGet/redisSetWithTtl, or set REDIS_URL and REDIS_DISABLED=false."
    );
  }
  return getIo();
}
