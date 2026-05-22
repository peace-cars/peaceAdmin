import { Capacitor, CapacitorHttp } from '@capacitor/core';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const isNative = Capacitor.isNativePlatform();
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  return (isLocalhost && !isNative) ? 'http://localhost:3000' : 'https://backend-eabm.onrender.com';
};

export const API_URL = getApiUrl();

const CACHE_PREFIX = 'peace_cache_';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedData(key: string) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    // Don't use data older than 24h if we can avoid it, but better than nothing when offline
    return data;
  } catch (e) {
    return null;
  }
}

function setCachedData(key: string, data: any) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // If storage is full, clear old cache
    if (e.name === 'QuotaExceededError') {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  }
}

export async function apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
  const method = options.method || 'GET';
  const isCacheable = method === 'GET';
  let finalEndpoint = endpoint;
  if (method === 'GET') {
    const selectedBranch = localStorage.getItem('admin_selected_branch');
    if (selectedBranch && selectedBranch !== 'all') {
      const separator = finalEndpoint.includes('?') ? '&' : '?';
      finalEndpoint = `${finalEndpoint}${separator}branchId=${selectedBranch}`;
    }
  }
  const cacheKey = btoa(finalEndpoint); // Branch-aware cache key
  const url = `${API_URL}${finalEndpoint.startsWith('/') ? finalEndpoint : `/${finalEndpoint}`}`;
  
  const sessionStr = localStorage.getItem('admin_session');
  let token = null;
  
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      token = session.access_token;
    } catch (e) {
      console.error('[API] Failed to parse session', e);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const executeRequest = async (): Promise<T> => {
    let rawData: any;
    
    // Use Native HTTP for Mobile
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data: options.body ? JSON.parse(options.body) : undefined,
        connectTimeout: 8000,
        readTimeout: 8000,
      });

      if (response.status >= 400) {
        throw new Error(response.data?.message || `API Error ${response.status}`);
      }
      rawData = response.data;
    } else {
      // Fallback for Web/PWA
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API request failed' }));
        throw new Error(error.message || 'API request failed');
      }
      rawData = await response.json();
    }

    // Safely unwrap standard enterprise response wrapper if present
    if (rawData && typeof rawData === 'object' && 'success' in rawData && 'data' in rawData) {
      return rawData.data;
    }
    
    return rawData;
  };

  try {
    const result = await executeRequest();
    
    // Success: Update cache if it's a GET request
    if (isCacheable) {
      setCachedData(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    // Failure: Try to return cached data for GET requests
    if (isCacheable) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        console.warn(`[API] Serving offline cache for ${endpoint}`);
        return cached;
      }
    }
    
    console.error('[API] Fatal Error:', error);
    throw error;
  }
}

export function unwrapApiResponse(payload: any): any {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return payload.data;
  }
  return payload;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => 
    apiFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any, options?: RequestInit) => 
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) => 
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
