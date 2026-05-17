import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import './i18n/i18n'
import App from './App.tsx'

// Global API Interceptor for seamless production and emulator networking
const originalFetch = window.fetch;
window.fetch = function (input: any, init?: any) {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input && input.url ? input.url : ''));
  if (url.startsWith('http://localhost:3000')) {
    const apiBase = import.meta.env.VITE_API_URL || (Capacitor.getPlatform() === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
    const newUrl = url.replace('http://localhost:3000', apiBase);
    if (typeof input === 'string') {
      input = newUrl;
    } else if (input instanceof URL) {
      input = new URL(newUrl);
    } else {
      input = new Request(newUrl, input);
    }
  }
  return originalFetch.call(this, input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
