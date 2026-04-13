import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
  }
  return redis;
}

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const r = getRedis();
  const current = await r.incr(key);
  if (current === 1) {
    await r.expire(key, windowSeconds);
  }
  return current <= limit;
}

export async function blacklistToken(tokenId: string, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  await r.set(`blacklist:${tokenId}`, '1', 'EX', ttlSeconds);
}

export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  const r = getRedis();
  const result = await r.get(`blacklist:${tokenId}`);
  return result !== null;
}

export async function setCallState(callId: string, state: Record<string, string>, ttlSeconds: number = 3600): Promise<void> {
  const r = getRedis();
  await r.hset(`call:${callId}`, state);
  await r.expire(`call:${callId}`, ttlSeconds);
}

export async function getCallState(callId: string): Promise<Record<string, string> | null> {
  const r = getRedis();
  const state = await r.hgetall(`call:${callId}`);
  return Object.keys(state).length > 0 ? state : null;
}

export async function shutdownRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
