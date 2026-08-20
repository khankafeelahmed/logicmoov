import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

let client: Redis | null = null;

/**
 * Returns a shared Redis client, or null when REDIS_URL is not configured.
 * The API degrades gracefully (no caching) when Redis is unavailable.
 */
export function getRedis(): Redis | null {
  if (!env.redisUrl) return null;
  if (client) return client;

  client = new Redis(env.redisUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
  });

  client.on("error", (err) => {
    logger.warn(`Redis error: ${err.message}`);
  });

  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore cache write failures */
  }
}
