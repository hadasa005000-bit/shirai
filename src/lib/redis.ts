import Redis from "ioredis";

const globalForRedis = global as unknown as { redis?: Redis };

// Aiven Redis connection strings look like:
// rediss://default:PASSWORD@your-service-name.aivencloud.com:PORT
// (note the double "s" — Aiven requires TLS)
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
const ONLINE_TTL_SECONDS = 45; // heartbeat window — client pings every ~20s

/** Called on each heartbeat ping from a connected browser tab. */
export async function markOnline(sessionId: string) {
  if (!redis) return;
  await redis.set(ONLINE_KEY_PREFIX + sessionId, "1", "EX", ONLINE_TTL_SECONDS);
}

/** Returns how many distinct sessions are currently online. */
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

const VISIT_KEY_PREFIX = "visit:logged:";
const VISIT_TTL_SECONDS = 60 * 60 * 26; // קצת יותר מיממה, כדי לכסות הבדלי אזורי זמן

// Fallback במקרה ש-Redis לא מוגדר (לא אמור לקרות בפרודקשן, אבל שלא ישבור
// כלום אם כן) — מפה בזיכרון התהליך, מתאפסת אם השרת מופעל מחדש.
const inMemoryVisitFallback = new Map<string, number>();

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/** האם כבר נרשם ביקור ל-sessionId הזה היום? */
export async function wasVisitLoggedToday(sessionId: string): Promise<boolean> {
  const key = VISIT_KEY_PREFIX + todayKey() + ":" + sessionId;
  if (!redis) {
    return inMemoryVisitFallback.has(key);
  }
  const exists = await redis.exists(key);
  return exists === 1;
}

/** מסמן שנרשם ביקור ל-sessionId הזה היום (עם תפוגה אוטומטית). */
export async function markVisitLoggedToday(sessionId: string) {
  const key = VISIT_KEY_PREFIX + todayKey() + ":" + sessionId;
  if (!redis) {
    inMemoryVisitFallback.set(key, Date.now());
    return;
  }
  await redis.set(key, "1", "EX", VISIT_TTL_SECONDS);
}

/** Simple cache helper the bot / pages can reuse. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300) {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
