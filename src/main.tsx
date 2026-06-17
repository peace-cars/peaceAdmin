import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import './index.css';
import './i18n/i18n';
import App from './App.tsx';

const getApiBase = () => {
  const isNative = Capacitor.isNativePlatform();
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
  let apiBase = 'https://backend-eabm.onrender.com';
  
  if (import.meta.env.VITE_API_URL) {
    apiBase = import.meta.env.VITE_API_URL;
  } else if (isLocalhost && !isNative) {
    apiBase = 'http://localhost:3000';
  }

  if (!apiBase.endsWith('/api/v1')) {
    apiBase = apiBase.replace(/\/+$/, '') + '/api/v1';
  }
  return apiBase;
};

const getBackendHosts = () => {
  const isNative = Capacitor.isNativePlatform();
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
  let activeHost = 'https://backend-eabm.onrender.com';
  
  if (import.meta.env.VITE_API_URL) {
    activeHost = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  } else if (isLocalhost && !isNative) {
    activeHost = 'http://localhost:3000';
  }
  
  return [activeHost, 'https://backend-eabm.onrender.com'];
};

// Global API Interceptor for seamless production and native networking
const originalFetch = window.fetch;
window.fetch = async function (input: any, init?: any) {
  let url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input && input.url
          ? input.url
          : '';
  const apiBase = getApiBase();
  const backendHosts = getBackendHosts();

  for (const host of backendHosts) {
    if (
      host &&
      url.startsWith(host) &&
      !url.startsWith(`${host}/api/v1`) &&
      !url.startsWith(`${host}/api/`) &&
      !url.startsWith(`${host}/socket.io`)
    ) {
      const suffix = url.slice(host.length);
      url = apiBase + (suffix.startsWith('/') ? suffix : `/${suffix}`);
      if (import.meta.env.DEV) {
        console.debug('[RequestTracker] Rewrote backend request:', suffix, '->', url);
      }
      break;
    }
  }

  if (import.meta.env.DEV) {
    console.debug('[RequestTracker] Fetch', init?.method || 'GET', url);
  }

  // If on native platform, bypass the browser WebView stack completely using CapacitorHttp
  if (Capacitor.isNativePlatform()) {
    try {
      const method = init?.method || 'GET';
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          Object.assign(headers, init.headers);
        }
      }

      if (init?.body && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }

      let data: any = undefined;
      if (init?.body) {
        if (typeof init.body === 'string') {
          try {
            data = JSON.parse(init.body);
          } catch {
            data = init.body;
          }
        } else {
          data = init.body;
        }
      }

      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data,
      });

      const responseBody =
        typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
      return new Response(responseBody, {
        status: response.status,
        statusText: 'OK',
        headers: new Headers(response.headers as Record<string, string>),
      });
    } catch (err: any) {
      console.error('[CapacitorHttp Interceptor Error]', err);
    }
  }

  // Browser standard fallback
  let fallbackInput = input;
  if (typeof input === 'string') {
    fallbackInput = url;
  } else if (input instanceof URL) {
    fallbackInput = new URL(url);
  } else if (input) {
    fallbackInput = new Request(url, input);
  }

  return originalFetch.call(this, fallbackInput, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
