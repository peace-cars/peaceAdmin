import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../lib/ThemeContext';
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
  const { i18n } = useTranslation();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (localSearch) {
        newParams.set('q', localSearch);
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams, { replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, setSearchParams]);

  return (
    <header className="h-[calc(4.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-border-subtle/30 flex items-center justify-between px-4 md:px-6 sticky top-0 bg-bg-base z-[100] transition-all gap-3">
      {/* Left: Menu & Search */}
      <div className="flex items-center gap-2 flex-1">
        <button 
          onClick={onToggleSidebar}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl hover:bg-surface-hover/50 transition-all active:scale-90 text-text-muted hover:text-text-main group lg:hidden"
        >
          <Menu size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        
        <div className="relative group w-full max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40 group-focus-within:text-primary-main transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search assets..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full h-11 rounded-[20px] bg-bg-secondary/60 border-none pl-11 pr-4 text-[13px] font-semibold text-text-main shadow-sm transition-all placeholder:text-text-muted/40 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-primary-main/20"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <div className="flex items-center gap-1 p-1 rounded-[16px]">
           {/* Theme Toggle */}
           <button 
             onClick={toggleTheme}
             className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-secondary/60 hover:bg-surface-card transition-all active:scale-95 text-text-main shadow-sm"
             title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
           >
             {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
           </button>

           {/* Language Selector */}
           <button 
             className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-secondary/60 hover:bg-surface-card transition-all active:scale-95 text-text-main font-black text-[11px] uppercase shadow-sm"
           >
             {i18n.language || 'EN'}
           </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={onToggleNotifs} 
            className={clsx(
              "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-sm relative",
              showNotifs 
                ? "bg-primary-main/10 text-primary-main shadow-primary-main/10" 
                : "bg-bg-secondary/60 text-text-main hover:bg-surface-card"
            )}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-[#8B93A5] text-white text-[10px] font-bold rounded-full border-2 border-bg-base">
                {unreadCount}
              </span>
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
