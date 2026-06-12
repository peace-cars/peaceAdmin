import { api } from './api';

interface CacheItem {
  data: any;
  timestamp: number;
}

const cacheStore: Record<string, CacheItem> = {};

export const apiCache = {
  get: (key: string): any | null => {
    const item = cacheStore[key];
    if (item) {
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
      // Optional: remove specific localStorage key if known, but usually we clear all
    } else {
      Object.keys(cacheStore).forEach(k => delete cacheStore[k]);
      Object.keys(localStorage)
        .filter(k => k.startsWith('peace_cache_'))
        .forEach(k => localStorage.removeItem(k));
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
  let cachedEntry = cacheStore[cacheKey];

  // 1.5 Fallback to persistent localStorage cache from api.ts
  if (!cachedEntry && (!options.method || options.method === 'GET')) {
    let finalEndpoint = endpoint;
    if (selectedBranch && selectedBranch.toUpperCase() !== 'ALL' && !endpoint.startsWith('/locations')) {
      const separator = finalEndpoint.includes('?') ? '&' : '?';
      finalEndpoint = `${finalEndpoint}${separator}branchId=${selectedBranch}`;
    }
    const apiCacheKey = 'peace_cache_' + btoa(finalEndpoint);
    try {
      const local = localStorage.getItem(apiCacheKey);
      if (local) {
        const parsed = JSON.parse(local);
        cachedEntry = { data: parsed.data, timestamp: parsed.timestamp || 0 };
        apiCache.set(cacheKey, parsed.data); // warm up in-memory cache
      }
    } catch(e) {}
  }

  const cached = cachedEntry ? cachedEntry.data : null;

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

