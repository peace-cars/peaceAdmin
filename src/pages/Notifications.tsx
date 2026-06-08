import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { unwrapApiResponse } from '../lib/api';
import { Bell, CheckCircle2, Trash2, Calendar, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Notifications: React.FC = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = unwrapApiResponse(await res.json());
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Notifications Sync Failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [session?.access_token]);

  const markAllRead = async () => {
    if (!session?.user?.id || !session?.access_token) return;
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ recipientId: session.user.id }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const last24hCount = notifications.filter(n => {
    return (Date.now() - new Date(n.created_at).getTime()) < 86400000;
  }).length;

  // ── Sub-components ─────────────────────────────────────────────────────────

  const MobileKpiCards = () => (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-surface-card border border-border-subtle/30 p-4 rounded-[20px] flex flex-col gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary-main/10 flex items-center justify-center text-primary-main">
          <Bell size={18} />
        </div>
        <p className="text-xl font-black text-text-main">{notifications.length}</p>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight">Total Alerts</p>
      </div>
      <div className="bg-surface-card border border-border-subtle/30 p-4 rounded-[20px] flex flex-col gap-2">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
          <Clock size={18} />
        </div>
        <p className="text-xl font-black text-text-main">{unreadCount}</p>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight">Unread</p>
      </div>
      <div className="bg-surface-card border border-border-subtle/30 p-4 rounded-[20px] flex flex-col gap-2">
        <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
          <Calendar size={18} />
        </div>
        <p className="text-xl font-black text-text-main">{last24hCount}</p>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight">Last 24h</p>
      </div>
    </div>
  );

  const MobileNotifItem = ({ n, idx }: { n: any; idx: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={clsx(
        'p-4 rounded-[20px] border flex gap-3 items-start transition-all',
        !n.isRead
          ? 'bg-primary-main/[0.04] border-primary-main/15'
          : 'bg-surface-card border-border-subtle/30',
      )}
    >
      <div className={clsx(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
        !n.isRead
          ? 'bg-primary-main text-white shadow-lg shadow-primary-main/20'
          : 'bg-bg-secondary text-text-muted border border-border-subtle/30',
      )}>
        <Bell size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={clsx(
            'text-[13px] font-black tracking-tight uppercase leading-tight',
            !n.isRead ? 'text-text-main' : 'text-text-secondary',
          )}>
            {n.title}
          </h3>
          {!n.isRead && (
            <div className="w-2.5 h-2.5 bg-primary-main rounded-full mt-1 shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-[12px] text-text-muted font-medium leading-relaxed">
          {n.body || n.message}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-[10px] font-bold text-text-muted/40 font-mono">
            {new Date(n.created_at).toLocaleString()}
          </span>
          <button
            onClick={() => deleteNotif(n.id)}
            className="text-[10px] font-black text-red-500/50 uppercase tracking-wider hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 size={10} /> Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 pb-28 animate-fade-in">

      {/* ── DESKTOP STICKY HEADER ─────────────────────────────────────────── */}
      <div className="hidden md:block sticky top-0 z-30 -mx-4 md:-mx-8 -mt-5 md:-mt-8 border-b border-border-subtle/30 bg-bg-base/95 px-4 py-4 shadow-sm backdrop-blur-md md:px-8">
        <div className="rounded-[28px] border border-border-subtle/70 bg-surface-card/95 p-4 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell size={22} className="text-primary-main" />
              <h1 className="text-xl font-black text-text-main tracking-tight">Registry Pulse</h1>
            </div>
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary-main/10 text-primary-main rounded-xl border border-primary-main/20 text-[13px] font-black uppercase tracking-wider hover:bg-primary-main/20 transition-all active:scale-95"
            >
              <CheckCircle2 size={14} /> Flush All
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP KPI GRID ──────────────────────────────────────────────── */}
      <div className="hidden md:grid grid-cols-3 gap-6">
        {[
          { label: 'Total Alerts', value: notifications.length, icon: <Bell size={24} />, color: 'bg-primary-main/10 text-primary-main' },
          { label: 'Unread', value: unreadCount, icon: <Clock size={24} />, color: 'bg-yellow-500/10 text-yellow-500' },
          { label: 'Last 24h', value: last24hCount, icon: <Calendar size={24} />, color: 'bg-green-500/10 text-green-500' },
        ].map(k => (
          <div key={k.label} className="bg-surface-card border border-border-subtle/30 p-5 rounded-3xl flex items-center gap-4">
            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center', k.color)}>{k.icon}</div>
            <div>
              <p className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none">{k.label}</p>
              <p className="text-2xl font-black text-text-main mt-1">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP NOTIFICATION FEED ─────────────────────────────────────── */}
      <div className="hidden md:block bg-surface-card border border-border-subtle/30 rounded-[32px] overflow-hidden shadow-xl shadow-black/5">
        <div className="p-6 border-b border-border-subtle/30 bg-bg-secondary/20 flex items-center justify-between">
          <span className="text-[14px] font-black text-text-main uppercase tracking-tight">Notification Feed</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-text-muted/40 uppercase tracking-tighter italic pr-2 border-r border-border-subtle/30">Auto-refreshing</span>
            <Bell size={14} className="text-primary-main animate-pulse" />
          </div>
        </div>
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-main/20 rounded-full animate-spin" />
            <p className="text-[12px] font-bold text-text-muted uppercase tracking-widest">Scanning Registry...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[32px] bg-bg-secondary/40 flex items-center justify-center text-text-muted/10"><Bell size={40} /></div>
            <div className="space-y-1">
              <p className="text-[15px] font-black text-text-main uppercase tracking-tight">The pulse is steady</p>
              <p className="text-[12px] font-bold text-text-muted/40 uppercase tracking-widest leading-relaxed">No critical or operational alerts pending review.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/20">
            {notifications.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={clsx('p-6 hover:bg-bg-secondary/40 transition-all group flex gap-6 items-start', !n.isRead ? 'bg-primary-main/[0.03]' : 'bg-transparent')}
              >
                <div className="shrink-0 pt-1">
                  <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center', !n.isRead ? 'bg-primary-main text-white shadow-lg shadow-primary-main/20' : 'bg-bg-secondary text-text-muted border border-border-subtle/30')}>
                    <Bell size={20} />
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={clsx('text-[15px] font-black tracking-tight uppercase leading-none', !n.isRead ? 'text-text-main' : 'text-text-secondary')}>{n.title}</h3>
                    <span className="text-[11px] font-bold text-text-muted/40 font-mono">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-[14px] text-text-muted font-medium leading-relaxed max-w-3xl">{n.body || n.message}</p>
                  <div className="mt-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[11px] font-black text-primary-main uppercase tracking-wider hover:underline">View Reference</button>
                    <div className="w-1 h-1 rounded-full bg-border-subtle/30" />
                    <button onClick={() => deleteNotif(n.id)} className="text-[11px] font-black text-red-500/60 uppercase tracking-wider hover:text-red-500">Dismiss Forever</button>
                  </div>
                </div>
                {!n.isRead && <div className="w-3 h-3 bg-primary-main rounded-full mt-2 shrink-0 animate-pulse" />}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MOBILE SECTION
      ══════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-4">

        {/* ── Single sticky banner: ALL BRANCHES + Registry Pulse title ── */}
        <div className="sticky top-0 z-40 bg-bg-base -mx-4 px-4 pb-2">
          {/* Row 1: Branch label (set from Dashboard) + Flush All */}
          <div className="h-[40px] flex items-center justify-between">
            <span className="text-text-main font-black uppercase tracking-wide text-[16px]">
              {localStorage.getItem('admin_selected_branch_name') || 'ALL BRANCHES'}
            </span>
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-main/10 text-primary-main rounded-xl border border-primary-main/20 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all"
            >
              <CheckCircle2 size={12} /> Flush All
            </button>
          </div>
          {/* Row 2: Registry Pulse ledger card */}
          <div className="bg-surface-card rounded-[16px] px-4 py-3 shadow-sm border border-border-subtle/30 flex items-center gap-3">
            <Bell size={20} className="text-[#1976d2] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black tracking-tight text-text-main">Registry Pulse</p>
              <p className="text-[10px] text-text-muted font-medium truncate">System alerts &amp; operational updates</p>
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
        </div>

        {/* Mobile KPI cards */}
        <MobileKpiCards />

        {/* Mobile notification list */}
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary-main/20 rounded-full animate-spin" />
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Scanning Registry...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-[24px] bg-bg-secondary/40 flex items-center justify-center text-text-muted/10"><Bell size={32} /></div>
            <div className="space-y-1">
              <p className="text-[14px] font-black text-text-main uppercase tracking-tight">The pulse is steady</p>
              <p className="text-[11px] font-bold text-text-muted/40 uppercase tracking-widest leading-relaxed">No alerts pending review.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n, idx) => (
              <MobileNotifItem key={n.id} n={n} idx={idx} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Notifications;
