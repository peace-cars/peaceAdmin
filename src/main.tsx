import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import './index.css'
import './i18n/i18n'
import App from './App.tsx'

// Global API Interceptor for seamless production and native networking
const originalFetch = window.fetch;
window.fetch = async function (input: any, init?: any) {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input && input.url ? input.url : ''));
  
  if (url.startsWith(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`)) {
    const isNative = Capacitor.isNativePlatform();
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const defaultApi = (isLocalhost && !isNative) ? 'http://localhost:3000' : 'https://backend-eabm.onrender.com';
    const apiBase = import.meta.env.VITE_API_URL || defaultApi;
    url = url.replace(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`, apiBase);
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

      const responseBody = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
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
)
