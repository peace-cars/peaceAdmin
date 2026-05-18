interface CacheItem {
  data: any;
  timestamp: number;
}

const cacheStore: Record<string, CacheItem> = {};

export const apiCache = {
  get: (key: string, ttl: number = 30000): any | null => {
    const item = cacheStore[key];
    if (item && Date.now() - item.timestamp < ttl) {
      return item.data;
    }
    return null;
  },
  set: (key: string, data: any): void => {
    cacheStore[key] = {
      data,
      timestamp: Date.now()
    };
  },
  clear: (key?: string): void => {
    if (key) {
      delete cacheStore[key];
    } else {
      Object.keys(cacheStore).forEach(k => delete cacheStore[k]);
    }
  }
};

/**
 * Custom SWR (Stale-While-Revalidate) Fetcher.
 * 1. Instantly triggers onData callback if cached data exists (no loading states!).
 * 2. Fetches fresh data silently in the background.
 * 3. Only triggers onData update if the fresh data has actually changed, preventing flashing.
 */
export async function fetchWithCache(
  url: string,
  options: RequestInit = {},
  onData: (data: any) => void,
  ttl: number = 10000 // 10s default TTL
) {
  const cacheKey = `${url}_${options.method || 'GET'}_${JSON.stringify(options.body || '')}`;

  // 1. Get cached state
  const cached = apiCache.get(cacheKey, ttl);
  if (cached !== null) {
    onData(cached);
  }

  // 2. Perform background request
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    const freshData = await res.json();

    // 3. Check for actual diff
    const cachedStr = cached ? JSON.stringify(cached) : null;
    const freshStr = JSON.stringify(freshData);

    if (cachedStr !== freshStr) {
      apiCache.set(cacheKey, freshData);
      onData(freshData);
    }
    return freshData;
  } catch (err) {
    console.warn(`[API Cache] Revalidation failed for ${url}:`, err);
    if (cached !== null) {
      onData(cached);
    }
    throw err;
  }
}
