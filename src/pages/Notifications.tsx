import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Bell, CheckCircle2, Trash2, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/notifications', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (e) {
      console.error("Notifications Sync Failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [session?.access_token]);

  const markAllRead = async () => {
    if (!session?.user?.id || !session?.access_token) return;
    await fetch('http://localhost:3000/notifications/mark-all-read', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${session.access_token}` 
      },
      body: JSON.stringify({ recipientId: session.user.id })
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotif = async (id: string) => {
    // Assuming there's a delete endpoint or just local filter for now
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-card border border-border-subtle/30 hover:bg-surface-hover transition-all"
          >
            <ArrowLeft size={20} className="text-text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tight uppercase">Registry Pulse</h1>
            <p className="text-[13px] font-bold text-text-muted/60 uppercase tracking-widest mt-1">System Alerts & Operational Updates</p>
          </div>
        </div>
        
        <button 
          onClick={markAllRead}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-main/10 text-primary-main rounded-2xl border border-primary-main/20 text-[13px] font-black uppercase tracking-wider hover:bg-primary-main/20 transition-all active:scale-95 shadow-lg shadow-primary-main/5"
        >
          <CheckCircle2 size={16} />
          Flush All
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border-subtle/30 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-main/10 flex items-center justify-center text-primary-main">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none">Total Alerts</p>
            <p className="text-2xl font-black text-text-main mt-1">{notifications.length}</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/30 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none">Unread</p>
            <p className="text-2xl font-black text-text-main mt-1">{notifications.filter(n => !n.isRead).length}</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/30 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none">Last 24h</p>
            <p className="text-2xl font-black text-text-main mt-1">
              {notifications.filter(n => {
                const date = new Date(n.created_at);
                return (Date.now() - date.getTime()) < 86400000;
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-surface-card border border-border-subtle/30 rounded-[32px] overflow-hidden shadow-xl shadow-black/5">
        <div className="p-6 border-b border-border-subtle/30 bg-bg-secondary/20 flex items-center justify-between">
           <span className="text-[14px] font-black text-text-main uppercase tracking-tight">Notification Feed</span>
           <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-muted/40 uppercase tracking-tighter italic pr-2 border-r border-border-subtle/30">Auto-refreshing</span>
              <Bell size={14} className="text-primary-main animate-pulse" />
           </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
             <p className="text-[12px] font-bold text-text-muted uppercase tracking-widest">Scanning Registry...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[32px] bg-bg-secondary/40 flex items-center justify-center text-text-muted/10">
               <Bell size={40} />
            </div>
            <div className="space-y-1">
               <p className="text-[15px] font-black text-text-main uppercase tracking-tight">The pulse is steady</p>
               <p className="text-[12px] font-bold text-text-muted/40 uppercase tracking-widest leading-relaxed">No critical or operational alerts pending review.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/20">
            {notifications.map((n, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={n.id} 
                className={clsx(
                  'p-6 hover:bg-bg-secondary/40 transition-all group flex gap-6 items-start',
                  !n.isRead ? 'bg-primary-main/[0.03]' : 'bg-transparent'
                )}
              >
                {/* Visual Indicator */}
                <div className="shrink-0 pt-1">
                   <div className={clsx(
                     "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                     !n.isRead ? "bg-primary-main text-white shadow-lg shadow-primary-main/20" : "bg-bg-secondary text-text-muted border border-border-subtle/30"
                   )}>
                      <Bell size={20} />
                   </div>
                </div>

                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={clsx(
                      "text-[15px] font-black tracking-tight uppercase leading-none",
                      !n.isRead ? "text-text-main" : "text-text-secondary"
                    )}>
                      {n.title}
                    </h3>
                    <span className="text-[11px] font-bold text-text-muted/40 font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[14px] text-text-muted font-medium leading-relaxed max-w-3xl">
                    {n.body || n.message}
                  </p>
                  
                  {/* Actions Area */}
                  <div className="mt-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="text-[11px] font-black text-primary-main uppercase tracking-wider hover:underline">View Reference</button>
                     <div className="w-1 h-1 rounded-full bg-border-subtle/30" />
                     <button onClick={() => deleteNotif(n.id)} className="text-[11px] font-black text-red-500/60 uppercase tracking-wider hover:text-red-500">Dismiss Forever</button>
                  </div>
                </div>

                {/* Unread dot */}
                {!n.isRead && (
                  <div className="w-3 h-3 bg-primary-main rounded-full mt-2 shrink-0 animate-pulse" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
