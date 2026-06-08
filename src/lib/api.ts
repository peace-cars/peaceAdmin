import { Capacitor, CapacitorHttp } from '@capacitor/core';

const getApiUrl = () => {
  const isNative = Capacitor.isNativePlatform();
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  let base = import.meta.env.VITE_API_URL;
  
  if (isNative) {
    base = 'http://10.0.2.2:3000';
  } else if (!base) {
    base = (isLocalhost) ? 'http://localhost:3000' : 'https://backend-eabm.onrender.com';
  }
  if (!base.endsWith('/api/v1')) {
    base = base.replace(/\/+$/, '') + '/api/v1';
  }
  return base;
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
  const sessionStr = localStorage.getItem('admin_session');
  let token = null;
  let userRole = null;
  
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      token = session.access_token;
      // Role is stored under profile, not user
      userRole = session.profile?.role || session.user?.role || session.role;
    } catch (e) {
      console.error('[API] Failed to parse session', e);
    }
  }

  let finalEndpoint = endpoint;
  if (method === 'GET') {
    const selectedBranch = localStorage.getItem('admin_selected_branch');
    if (selectedBranch && selectedBranch.toUpperCase() !== 'ALL' && !endpoint.startsWith('/locations')) {
      const separator = finalEndpoint.includes('?') ? '&' : '?';
      finalEndpoint = `${finalEndpoint}${separator}branchId=${selectedBranch}`;
    }
  }
  const cacheKey = btoa(finalEndpoint); // Branch-aware cache key
  const url = finalEndpoint.startsWith('http') 
    ? finalEndpoint 
    : `${API_URL}${finalEndpoint.startsWith('/') ? finalEndpoint : `/${finalEndpoint}`}`;

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
        readTimeout: 30000, // 30s timeout
      });

      if (response.status >= 400) {
        throw new Error(response.data?.message || `API Error ${response.status}`);
      }
      rawData = response.data;
    } else {
      // Fallback for Web/PWA
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      try {
        const response = await fetch(url, { ...options, headers, credentials: 'include', signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'API request failed' }));
          throw new Error(error.message || 'API request failed');
        }
        rawData = await response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds');
        }
        throw err;
      }
    }

    // Safely unwrap standard enterprise response wrapper if present
    if (rawData && typeof rawData === 'object' && 'success' in rawData && 'data' in rawData) {
      return rawData.data;
    }
    
    return rawData;
  };

  let retries = isCacheable ? 1 : 0;
  
  while (true) {
    try {
      const result = await executeRequest();
      
      // Success: Update cache if it's a GET request
      if (isCacheable) {
        setCachedData(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      if (retries > 0) {
        retries--;
        console.warn(`[API] Retrying ${endpoint}...`);
        await new Promise(r => setTimeout(r, 2000)); // 2s delay
        continue;
      }

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
