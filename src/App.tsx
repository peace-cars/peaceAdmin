import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { CapacitorBackButtonHandler } from './components/ui/CapacitorBackButtonHandler';
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt';
import { Capacitor } from '@capacitor/core';
import { unwrapApiResponse, apiFetch } from './lib/api';
import { fetchWithCache } from './lib/cache';
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
const SoldArchive = lazy(() => import('./pages/SoldArchive'));
const SoldArchiveDetail = lazy(() => import('./pages/SoldArchiveDetail'));
const CustomOrders = lazy(() => import('./pages/CustomOrders'));
const Notifications = lazy(() => import('./pages/Notifications'));
const FinanceManager = lazy(() => import('./pages/FinanceManager'));
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
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
           const data = unwrapApiResponse(await res.json());
           if (Array.isArray(data)) setNotifications(data);
        }
      } catch (e) {
        console.error("Notifications Sync Failed", e);
      }
    };

    const fetchScope = async () => {
      try {
        const res = await fetch(`${API_URL}/locations/my-scope`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = unwrapApiResponse(await res.json());
          setScope(data);
          if (data.branchName) localStorage.setItem('admin_location', data.branchName);
        }
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
    await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ recipientId: session.user.id })
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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
        </Routes>
      </Suspense>
      <PwaInstallPrompt />
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
