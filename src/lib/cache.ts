import { api } from './api';

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
  endpoint: string,
  options: RequestInit = {},
  onData: (data: any) => void,
  ttl: number = 10000 // 10s default TTL
) {
  const selectedBranch = localStorage.getItem('admin_selected_branch') || 'ALL';
  const cacheKey = `${endpoint}_${options.method || 'GET'}_${JSON.stringify(options.body || '')}_${selectedBranch}`;

  // 1. Get cached state
  const cached = apiCache.get(cacheKey, ttl);
  if (cached !== null) {
    onData(cached);
  }

  // 2. Perform background request
  try {
    const freshData = await api.get(endpoint, options);

    // 3. Check for actual diff
    const cachedStr = cached ? JSON.stringify(cached) : null;
    const freshStr = JSON.stringify(freshData);

    if (cachedStr !== freshStr) {
      apiCache.set(cacheKey, freshData);
      onData(freshData);
    }
    return freshData;
  } catch (err) {
    console.warn(`[API Cache] Revalidation failed for ${endpoint}:`, err);
    if (cached !== null) {
      onData(cached);
    }
    throw err;
  }
}

