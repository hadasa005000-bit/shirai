import Redis from "ioredis";

const globalForRedis = global as unknown as { redis?: Redis };

function createClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("REDIS_URL not set — online-user counter will be disabled.");
    return undefined;
  }
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    tls: url.startsWith("rediss://") ? {} : undefined,
  });
}

export const redis = globalForRedis.redis ?? createClient();
if (process.env.NODE_ENV !== "production" && redis) globalForRedis.redis = redis;

const ONLINE_KEY_PREFIX = "online:user:";
const ONLINE_TTL_SECONDS = 45;

export async function markOnline(sessionId: string) {
  if (!redis) return;
  await redis.set(ONLINE_KEY_PREFIX + sessionId, "1", "EX", ONLINE_TTL_SECONDS);
}

export async function countOnline(): Promise<number> {
  if (!redis) return 0;
  let cursor = "0";
  let count = 0;
  do {
    const [next, keys] = await redis.scan(
      cursor,
      "MATCH",
      ONLINE_KEY_PREFIX + "*",
      "COUNT",
      "100"
    );
    cursor = next;
    count += keys.length;
  } while (cursor !== "0");
  return count;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300) {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
