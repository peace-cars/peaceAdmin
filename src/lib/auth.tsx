import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from './api';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  location_id: string | null;
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
    const stored = localStorage.getItem('admin_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const nowSec = Math.floor(Date.now() / 1000);
        if (parsed.expires_at && parsed.expires_at < nowSec) {
          console.warn('[Admin Auth] Session expired, clearing stale token.');
          localStorage.removeItem('admin_session');
          localStorage.removeItem('admin_role');
          localStorage.removeItem('admin_location');
        } else {
          setSession(parsed);
        }
      } catch {
        localStorage.removeItem('admin_session');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session?.expires_at) return;
    const interval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      if (session.expires_at < nowSec) {
        console.warn('[Admin Auth] Token expired mid-session, logging out.');
        logout();
        window.location.href = '/login';
      }
    }, 30000);
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
        return { error: data.message || 'Login failed' };
      }

      const role = data.profile?.role;
      if (role !== 'GENERAL_MANAGER' && role !== 'DISTRICT_MANAGER' && role !== 'STAFF') {
        return { error: 'ACCESS DENIED: Insufficient privilege level.' };
      }

      const sessionData: SessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
        profile: data.profile,
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      localStorage.setItem('admin_role', role);
      localStorage.setItem('admin_location', data.profile?.location_id || 'HQ');
      setSession(sessionData);
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
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
        profile: data.profile,
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      localStorage.setItem('admin_role', role);
      localStorage.setItem('admin_location', data.profile?.location_id || 'HQ');
      setSession(sessionData);
      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_location');
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
