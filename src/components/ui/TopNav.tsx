import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Bell, Search, Menu, X, CheckCircle2, Globe, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../lib/ThemeContext';
import { Tooltip } from './Tooltip';
import { Badge } from './Badge';

interface TopNavProps {
  user: any;
  role: string | null;
  notifications: any[];
  showNotifs: boolean;
  scope?: any;
  onToggleNotifs: () => void;
  onMarkAllRead: () => void;
  onToggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  user, 
  role, 
  notifications, 
  showNotifs, 
  scope,
  onToggleNotifs, 
  onMarkAllRead,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const roleLabel = role?.replace(/_/g, ' ') || 'Manager';
  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'AD';

  return (
    <header className="h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-border-subtle/30 flex items-center justify-between px-6 sticky top-0 bg-surface-card/70 backdrop-blur-xl z-[100] transition-all">
      {/* Left: Menu */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-hover/50 transition-all active:scale-90 text-text-muted hover:text-text-main group"
        >
          <Menu size={20} className="group-hover:scale-110 transition-transform" />
        </button>
          <span className="text-[14px] font-black text-text-main tracking-tight leading-none uppercase">
            {scope?.branchName || 'PeaceCars'}
          </span>
      </div>

      {/* Center: Search (desktop only) - Compact button */}
      <div className="hidden md:flex flex-1 justify-center">
        <button
          type="button"
          className="h-11 w-11 rounded-2xl bg-bg-secondary/30 border border-border-subtle/20 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-secondary/50 transition-all"
          aria-label="Open global search"
        >
          <Search size={16} />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-bg-secondary/30 p-1 rounded-2xl border border-border-subtle/20 mr-2">
           {/* Theme Toggle */}
           <button 
             onClick={toggleTheme}
             className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-card transition-all active:scale-95 text-text-muted hover:text-primary-main"
             title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
           >
             {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
           </button>

           {/* Language Selector (Simplified) */}
           <button 
             className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-card transition-all active:scale-95 text-text-muted hover:text-primary-main font-black text-[10px] uppercase"
           >
             {i18n.language}
           </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={onToggleNotifs} 
            className={clsx(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 border",
              showNotifs 
                ? "bg-primary-main/10 border-primary-main/20 text-primary-main shadow-lg shadow-primary-main/10" 
                : "bg-bg-secondary/30 border-border-subtle/20 text-text-muted hover:text-text-main hover:border-border-subtle/40"
            )}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-card" />
            )}
          </button>
          
          {showNotifs && (
            <div className="absolute right-0 mt-3 w-80 bg-surface-card/95 backdrop-blur-xl border border-border-subtle/30 rounded-3xl shadow-2xl overflow-hidden z-[200] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle/30 bg-bg-secondary/20">
                <div className="flex items-center gap-2">
                   <span className="text-[13px] font-black text-text-main uppercase tracking-tight">Pulse Notifications</span>
                   {unreadCount > 0 && <Badge variant="primary" className="text-[9px] h-4">{unreadCount}</Badge>}
                </div>
                <button onClick={onMarkAllRead} className="text-[11px] text-primary-main font-bold hover:underline uppercase tracking-wider">Flush All</button>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-border-subtle/20 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-bg-secondary/50 flex items-center justify-center text-text-muted/20">
                       <Bell size={24} />
                    </div>
                    <p className="text-[12px] font-bold text-text-muted/40 uppercase tracking-widest">Quiet in the registry</p>
                  </div>
                ) : notifications.slice(0, 8).map(n => (
                  <div key={n.id} className={clsx('px-6 py-4 hover:bg-bg-secondary/40 cursor-pointer transition-colors group', !n.isRead && 'bg-primary-main/[0.03]')}>
                    <div className="flex items-start justify-between gap-3">
                      <p className={clsx('text-[13px] font-bold leading-tight', !n.isRead ? 'text-text-main' : 'text-text-muted')}>
                        {n.title}
                      </p>
                      {!n.isRead && <div className="w-1.5 h-1.5 bg-primary-main rounded-full mt-1.5 shrink-0 shadow-sm shadow-primary-main/50" />}
                    </div>
                    <p className="text-[12px] text-text-muted/60 mt-1 line-clamp-2 leading-relaxed font-medium">{n.body}</p>
                    <p className="text-[10px] text-text-muted/30 mt-2 font-bold uppercase tracking-tighter italic">Just now</p>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-bg-secondary/10 border-t border-border-subtle/30 text-center">
                 <button 
                   onClick={() => { navigate('/notifications'); onToggleNotifs(); }}
                   className="text-[11px] font-black text-primary-main uppercase tracking-widest hover:underline"
                 >
                   View All Registry Alerts
                 </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
