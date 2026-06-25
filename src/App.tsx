import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { CapacitorBackButtonHandler } from './components/ui/CapacitorBackButtonHandler';
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt';
import { Capacitor } from '@capacitor/core';
import { unwrapApiResponse, apiFetch } from './lib/api';
import { fetchWithCache } from './lib/cache';
import { supabase } from './lib/supabase';
import { Toaster, toast } from 'react-hot-toast';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Acquisitions = lazy(() => import('./pages/Acquisitions'));
const InspectionReports = lazy(() => import('./pages/InspectionReports'));
const InventoryManager = lazy(() => import('./pages/InventoryManager'));
const BranchRoster = lazy(() => import('./pages/BranchRoster'));
const BranchManagement = lazy(() => import('./pages/BranchManagement'));
const PeopleManagement = lazy(() => import('./pages/PeopleManagement'));
const CommissionApproval = lazy(() => import('./pages/CommissionApproval'));
const BudgetManager = lazy(() => import('./pages/BudgetManager'));
const StaffReports = lazy(() => import('./pages/StaffReports'));
const AssetLibrary = lazy(() => import('./pages/AssetLibrary'));
const SupportInbox = lazy(() => import('./pages/SupportInbox'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const SoldArchive = lazy(() => import('./pages/SoldArchive'));
const SoldArchiveDetail = lazy(() => import('./pages/SoldArchiveDetail'));
const CustomOrders = lazy(() => import('./pages/CustomOrders'));
const Notifications = lazy(() => import('./pages/Notifications'));
const FinanceManager = lazy(() => import('./pages/FinanceManager'));
const Settings = lazy(() => import('./pages/Settings'));
import { AppShell } from './components/ui/AppShell';
import { API_URL } from './lib/api';
import { initializePushNotifications } from './lib/push';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (session?.user?.id && Capacitor.isNativePlatform()) {
      initializePushNotifications(session.user.id);
    }
  }, [session]);

  // Keep Realtime JWT in sync on token refresh
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && newSession?.access_token) {
        supabase.realtime.setAuth(newSession.access_token);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Global Realtime Listeners for Admin Toasts
  useEffect(() => {
    if (!session?.user?.id || !session?.access_token) return;

    // Authenticate the Realtime WebSocket with the user's JWT
    supabase.realtime.setAuth(session.access_token);

    const navigate = (path: string) => { window.location.href = path; };

    const notifsChannel = supabase.channel('admin_global_notifs')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `recipient_id=eq.${session.user.id}`
      }, (payload) => {
        const notif = payload.new as any;
        toast.custom((t) => (
          <div style={{ zIndex: 999999 }} className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl pointer-events-auto flex overflow-hidden`}>
            <div className="flex-1 w-0 p-4 cursor-pointer" onClick={() => { navigate('/notifications'); toast.dismiss(t.id); }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-base shrink-0">🔔</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{notif.title || 'New Notification'}</p>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notif.body || notif.message}</p>
                </div>
              </div>
            </div>
            <button onClick={() => toast.dismiss(t.id)} className="shrink-0 px-4 border-l border-gray-200 dark:border-gray-700 text-xs font-black text-gray-400 hover:text-red-500 transition-colors">✕</button>
          </div>
        ), { duration: Infinity, position: 'top-right' });
        setNotifications(prev => [notif, ...prev]);
      }).subscribe((status) => console.log('[Admin Realtime] Notifs:', status));

    const msgsChannel = supabase.channel('admin_global_msgs')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== session.user.id) {
          toast.custom((t) => (
            <div style={{ zIndex: 999999 }} className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl pointer-events-auto flex overflow-hidden`}>
              <div className="flex-1 w-0 p-4 cursor-pointer" onClick={() => { navigate('/inbox'); toast.dismiss(t.id); }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base shrink-0">💬</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">New Client Message</p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{msg.text || msg.content}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => toast.dismiss(t.id)} className="shrink-0 px-4 border-l border-gray-200 dark:border-gray-700 text-xs font-black text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
          ), { duration: Infinity, position: 'top-right' });
        }
      }).subscribe((status) => console.log('[Admin Realtime] Messages:', status));

    return () => {
      supabase.removeChannel(notifsChannel);
      supabase.removeChannel(msgsChannel);
    };
  }, [session]);

  // ── Global prefetcher: warm all critical admin caches on login
  useEffect(() => {
    if (!session?.access_token) return;
    const prefetch = (url: string) =>
      fetchWithCache(url, {}, () => {}).catch(() => {});
    Promise.allSettled([
      prefetch(`${API_URL}/vehicles`),
      prefetch(`${API_URL}/locations`),
      prefetch(`${API_URL}/trade-in-requests`),
      prefetch(`${API_URL}/sourcing-requests`),
    ]);
  }, [session?.user?.id]);

  const handleToggleNotifs = async () => {
    if (session?.user?.id && !Capacitor.isNativePlatform() && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await initializePushNotifications(session.user.id, true);
      }
    }
    setShowNotifs(prev => !prev);
  };

  const [scope, setScope] = useState<any>(null);
  const role = localStorage.getItem('admin_role');

  useEffect(() => {
    if (!session?.access_token) return;
    
    const fetchNotifs = async () => {
      try {
        const data = await apiFetch<any[]>('/notifications');
        if (Array.isArray(data)) setNotifications(data);
      } catch (e) {
        console.error("Notifications Sync Failed", e);
      }
    };

    const fetchScope = async () => {
      try {
        const data = await apiFetch<any>('/locations/my-scope');
        setScope(data);
        if (data.branchName) localStorage.setItem('admin_location', data.branchName);
      } catch (e) {
        console.error("Scope Sync Failed", e);
      }
    };
    
    fetchNotifs();
    fetchScope();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [session?.access_token]);

  if (loading) {
    return <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-primary-main/20  rounded-full animate-spin" />
      <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">Verifying credentials...</p>
    </div>;
  }

  if (!session || !role) {
    return <Navigate to="/login" replace />;
  }

  const markAllRead = async () => {
    if (!session?.user?.id) return;
    try {
      await apiFetch('/notifications/mark-all-read', {
        method: 'POST',
        body: JSON.stringify({ recipientId: session.user.id })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    // Session state is cleared synchronously inside logout(),
    // so the ProtectedRoute's <Navigate to="/login"> guard fires automatically.
  };

  return (
    <AppShell
      user={session.profile}
      role={role}
      notifications={notifications}
      showNotifs={showNotifs}
      scope={scope}
      onToggleNotifs={() => setShowNotifs(!showNotifs)}
      onMarkAllRead={markAllRead}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}

import Splash from './components/ui/Splash';

function App() {
  const { session } = useAuth();
  const role = localStorage.getItem('admin_role');
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <ScrollToTop />
      <CapacitorBackButtonHandler />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg-base text-text-muted">Loading page…</div>}>
        <Routes>
          <Route path="/login" element={(session && role) ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/acquisitions" element={<ProtectedRoute><Acquisitions /></ProtectedRoute>} />
          <Route path="/inspections" element={<ProtectedRoute><InspectionReports /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><SupportInbox /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryManager /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><BranchRoster /></ProtectedRoute>} />
          <Route path="/branches" element={<ProtectedRoute><BranchManagement /></ProtectedRoute>} />
          <Route path="/people" element={<ProtectedRoute><PeopleManagement /></ProtectedRoute>} />
          <Route path="/commissions" element={<ProtectedRoute><CommissionApproval /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><BudgetManager /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><StaffReports /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinanceManager /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><AssetLibrary /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><SoldArchive /></ProtectedRoute>} />
          <Route path="/archive/:id" element={<ProtectedRoute><SoldArchiveDetail /></ProtectedRoute>} />
          <Route path="/custom-orders" element={<ProtectedRoute><CustomOrders /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </Suspense>
      <PwaInstallPrompt />
      <Toaster toastOptions={{ style: { zIndex: 999999 } }} />
    </Router>
  );
}

import { ThemeProvider } from './lib/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export default function Root() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
