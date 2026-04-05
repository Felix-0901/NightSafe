const cacheStore = globalThis.__nightsafeCacheStore || new Map();

if (!globalThis.__nightsafeCacheStore) {
  globalThis.__nightsafeCacheStore = cacheStore;
}

export function getCachedValue(key) {
  const entry = cacheStore.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
}

export function setCachedValue(key, value, ttlMs) {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  return value;
}

export async function withCache(key, ttlMs, factory) {
  const cached = getCachedValue(key);
  if (cached) {
    return cached;
  }

  const value = await factory();
  return setCachedValue(key, value, ttlMs);
}

