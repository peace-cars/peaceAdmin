import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from './api';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { supabase } from './supabase';

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  branch_id?: string | null;
  is_verified: boolean;
  is_inspector_verified: boolean;
  gamification_points: number;
}

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email: string };
  profile: UserProfile;
}

interface AuthContextType {
  session: SessionData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName: string, role: string, locationId?: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('admin_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const nowSec = Math.floor(Date.now() / 1000);
          
          // If token has expired or has less than 15 minutes remaining, refresh it!
          if (parsed.expires_at && parsed.expires_at - nowSec < 900) {
            console.log('[Admin Auth] Token is expiring or expired, attempting refresh...');
            const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
            if (res.ok) {
              const result = await res.json();
              const payload = result?.data ?? result;
              const newSessionData: SessionData = {
                // Store the real token — the Bearer header is the only reliable cross-origin auth mechanism
                access_token: payload.session?.access_token || payload.access_token || parsed.access_token || '',
                refresh_token: payload.session?.refresh_token || payload.refresh_token || '',
                expires_at: payload.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
                user: parsed.user,
                profile: parsed.profile
              };
              localStorage.setItem('admin_session', JSON.stringify(newSessionData));
              setSession(newSessionData);
              setLoading(false);
              return;
            } else {
              console.warn('[Admin Auth] Refresh failed, logging out');
              localStorage.removeItem('admin_session');
              localStorage.removeItem('admin_role');
              localStorage.removeItem('admin_location');
              localStorage.removeItem('admin_selected_branch');
              setSession(null);
            }
          } else if (!parsed.access_token) {
            // ── Session Repair Path ──────────────────────────────────────────
            // Legacy sessions (before the empty-token bug was fixed) have
            // access_token: '' stored in localStorage. Trigger a silent refresh
            // to restore the real token without forcing the user to re-login.
            console.log('[Admin Auth] Empty token detected in stored session — triggering silent repair refresh...');
            try {
              const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
              if (res.ok) {
                const result = await res.json();
                const payload = result?.data ?? result;
                const repairedSession: SessionData = {
                  access_token: payload.session?.access_token || payload.access_token || '',
                  refresh_token: payload.session?.refresh_token || payload.refresh_token || '',
                  expires_at: payload.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
                  user: parsed.user,
                  profile: parsed.profile
                };
                if (repairedSession.access_token) {
                  localStorage.setItem('admin_session', JSON.stringify(repairedSession));
                  setSession(repairedSession);
                  console.log('[Admin Auth] Session repair successful.');
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.warn('[Admin Auth] Session repair failed, using cookie-only auth');
            }
            // Fall through — cookie auth may still work
            setSession(parsed);
          } else {
            // Validate local storage role against session to prevent tampering
            const storedRole = localStorage.getItem('admin_role');
            const sessionRole = parsed.profile?.role;
            if (storedRole !== sessionRole) {
              console.warn('[Admin Auth] Role mismatch detected. Syncing from session...');
              localStorage.setItem('admin_role', sessionRole || 'USER');
            }

            setSession(parsed);
            // Supabase realtime is disabled
          }
        } catch (e) {
          console.error('[Admin Auth] Init error:', e);
          localStorage.removeItem('admin_session');
          localStorage.removeItem('admin_selected_branch');
        }
      }
      setLoading(false);
    };

    initAuth();

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Periodic background token refresh check
  useEffect(() => {
    if (!session?.expires_at) return;
    const interval = setInterval(async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      
      // If token expires in less than 15 minutes, refresh in background
      if (session.expires_at - nowSec < 900) {
        console.log('[Admin Auth] Background token refresh triggered...');
        try {
          const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
          if (res.ok) {
            const result = await res.json();
            const payload = result?.data ?? result;
            const newSessionData: SessionData = {
              access_token: payload.session?.access_token || payload.access_token || session.access_token || '',
              refresh_token: payload.session?.refresh_token || payload.refresh_token || '',
              expires_at: payload.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
              user: session.user,
              profile: session.profile
            };
            localStorage.setItem('admin_session', JSON.stringify(newSessionData));
            setSession(newSessionData);
            console.log('[Admin Auth] Background token refresh successful.');
          } else {
            console.warn('[Admin Auth] Background refresh failed');
          }
        } catch (e) {
          console.error('[Admin Auth] Background refresh error', e);
        }
      }
    }, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const url = `${API_URL}/auth/login`;
    try {
      let data: any;
      let ok: boolean;

      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.request({
          url,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email, password },
        });
        data = response.data;
        ok = response.status >= 200 && response.status < 300;
      } else {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        data = await res.json();
        ok = res.ok;
      }

      if (!ok) {
        const msg = data?.message || data?.data?.message || 'Login failed';
        return { error: msg };
      }

      // Unwrap the standardized API response envelope if present
      const payload = (data && typeof data === 'object' && 'success' in data && 'data' in data) ? data.data : data;

      const role = payload.profile?.role;
      if (role !== 'GENERAL_MANAGER' && role !== 'DISTRICT_MANAGER' && role !== 'STAFF' && role !== 'FINANCE_AUDITOR') {
        return { error: 'ACCESS DENIED: Insufficient privilege level.' };
      }

      const sessionData: SessionData = {
        // Store the real token so apiFetch can send it in the Authorization header
        // (cross-origin admin SPA cannot rely on httpOnly cookies across ports)
        access_token: payload.session?.access_token || '',
        refresh_token: payload.session?.refresh_token || '',
        expires_at: payload.session.expires_at,
        user: payload.user,
        profile: payload.profile,
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      localStorage.setItem('admin_role', role);
      localStorage.setItem('admin_branch_id', payload.profile?.branch_id || 'HQ');
      localStorage.removeItem('admin_selected_branch');
      setSession(sessionData);

      // Supabase realtime is now disabled in frontend or relies on anon key

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const register = async (email: string, password: string, fullName: string, role: string, phoneNumber: string = '0000000000', locationId?: string): Promise<{ error?: string }> => {
    const url = `${API_URL}/auth/register`;
    try {
      let data: any;
      let ok: boolean;

      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.request({
          url,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email, password, fullName, role, phoneNumber, locationId },
        });
        data = response.data;
        ok = response.status >= 200 && response.status < 300;
      } else {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, role, phoneNumber, locationId }),
        });
        data = await res.json();
        ok = res.ok;
      }

      if (!ok) {
        return { error: data.message || 'Registration failed' };
      }

      if (!data.session) {
         return { error: 'Registration successful. You can now login.' };
      }

      const sessionData: SessionData = {
        access_token: '', // Removed for XSS protection
        refresh_token: '',
        expires_at: data.session.expires_at,
        user: data.user,
        profile: data.profile,
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      localStorage.setItem('admin_role', role);
      localStorage.setItem('admin_branch_id', data.profile?.branch_id || 'HQ');
      setSession(sessionData);

      // Supabase realtime disabled for now

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_location');
    localStorage.removeItem('admin_selected_branch');
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
