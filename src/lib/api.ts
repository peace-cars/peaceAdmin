import { Capacitor, CapacitorHttp } from '@capacitor/core';

// ─── Token Refresh Lock ────────────────────────────────────────────────────
// Prevents race conditions: if 5 parallel requests get a 401, only one
// /auth/refresh call is made. All others wait for the lock to resolve.
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function onTokenRefreshed(newToken: string | null) {
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];
}

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    // Queue this caller and wait for the in-flight refresh to complete
    return new Promise(resolve => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const sessionStr = localStorage.getItem('admin_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    const refreshToken = session?.refresh_token;

    const res = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include',
    });

    if (!res.ok) {
      // Refresh token is also expired — force logout
      forceLogout();
      onTokenRefreshed(null);
      return null;
    }

    const result = await res.json();
    const payload = result?.data ?? result;
    const newAccessToken = payload.session?.access_token || payload.access_token;
    const newRefreshToken = payload.session?.refresh_token || payload.refresh_token;
    const newExpiresAt = payload.session?.expires_at || Math.floor(Date.now() / 1000) + 3600;

    if (newAccessToken && session) {
      const updatedSession = {
        ...session,
        access_token: newAccessToken,
        refresh_token: newRefreshToken || session.refresh_token,
        expires_at: newExpiresAt,
      };
      localStorage.setItem('admin_session', JSON.stringify(updatedSession));
      console.log('[Admin API] Token refresh successful via interceptor.');
    }

    onTokenRefreshed(newAccessToken || null);
    return newAccessToken || null;
  } catch (err) {
    console.error('[Admin API] Token refresh failed:', err);
    forceLogout();
    onTokenRefreshed(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

function forceLogout() {
  console.warn('[Admin API] Forcing logout due to invalid session.');
  localStorage.removeItem('admin_session');
  localStorage.removeItem('admin_role');
  localStorage.removeItem('admin_location');
  localStorage.removeItem('admin_selected_branch');
  // Redirect to login — works outside of React context
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

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
          const errorBody = await response.json().catch(() => ({ message: 'API request failed' }));
          const err: any = new Error(errorBody.message || 'API request failed');
          err.status = response.status;
          throw err;
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

  try {
    return await executeRequest();
  } catch (error: any) {
    // ─── 401 Interceptor ──────────────────────────────────────────────────
    // If Unauthorized, try to silently refresh the token and retry once.
    if (error?.status === 401) {
      console.warn(`[Admin API] 401 on ${endpoint} — attempting token refresh...`);
      const newToken = await attemptTokenRefresh();

      if (newToken) {
        // Retry the original request with the fresh token
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        };
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          const retryRes = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include', signal: controller.signal });
          clearTimeout(timeoutId);
          if (!retryRes.ok) {
            const err = await retryRes.json().catch(() => ({ message: 'Retry failed' }));
            throw new Error(err.message);
          }
          const retryData = await retryRes.json();
          const result = (retryData && typeof retryData === 'object' && 'success' in retryData) ? retryData.data : retryData;
          if (isCacheable) setCachedData(cacheKey, result);
          return result;
        } catch (retryErr) {
          // Retry also failed — fall through to cache/throw
        }
      }
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
