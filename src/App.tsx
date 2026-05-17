import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Dashboard from './pages/Dashboard';
import Acquisitions from './pages/Acquisitions';
import InspectionReports from './pages/InspectionReports';
import InventoryManager from './pages/InventoryManager';
import BranchRoster from './pages/BranchRoster';
import BranchManagement from './pages/BranchManagement';
import PeopleManagement from './pages/PeopleManagement';
import CommissionApproval from './pages/CommissionApproval';
import BudgetManager from './pages/BudgetManager';
import StaffReports from './pages/StaffReports';
import AssetLibrary from './pages/AssetLibrary';
import SupportInbox from './pages/SupportInbox';
import Login from './pages/Login';
import SoldArchive from './pages/SoldArchive';
import Notifications from './pages/Notifications';
import { AppShell } from './components/ui/AppShell';
import { API_URL } from './lib/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
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
           const data = await res.json();
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
          const data = await res.json();
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
      <div className="w-10 h-10 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
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

function App() {
  const { session } = useAuth();
  const role = localStorage.getItem('admin_role');

  return (
    <Router>
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
        <Route path="/library" element={<ProtectedRoute><AssetLibrary /></ProtectedRoute>} />
        <Route path="/archive" element={<ProtectedRoute><SoldArchive /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

import { ThemeProvider } from './lib/ThemeContext';

export default function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}
