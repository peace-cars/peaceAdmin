import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// Shared glassmorphism — mirrors BottomNav pill
const GLASS =
  'bg-white/40 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)]';

export const TopNav: React.FC<TopNavProps> = ({
  notifications,
  showNotifs,
  onToggleNotifs,
  onMarkAllRead,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (localSearch) newParams.set('q', localSearch);
      else newParams.delete('q');
      setSearchParams(newParams, { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchParams]);

  return (
    <>
      {/*
        Transparent + pointer-events-none container so gaps between elements
        let the background gradient show through. Only the glass pills/circles
        re-enable pointer events.
      */}
      <header
        className="sticky top-0 z-[100] bg-bg-base/40 backdrop-blur-xl border-b border-border-subtle/20 flex items-center gap-2.5 px-3 md:px-4"
        style={{
          height: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          paddingBottom: '10px',
        }}
      >
        {/* ── Hamburger — mobile only ── */}
        <button
          onClick={onToggleSidebar}
          title="Open Menu"
          className={clsx(
            'pointer-events-auto lg:hidden shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90',
            GLASS,
            'text-text-secondary hover:text-text-main',
          )}
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        {/* ── Search pill — takes remaining space ── */}
        <div
          className={clsx(
            'pointer-events-auto flex-1 relative flex items-center h-11 rounded-[22px] px-4 gap-2.5 group transition-all',
            GLASS,
            'focus-within:ring-2 focus-within:ring-primary-main/25 focus-within:border-primary-main/30',
          )}
        >
          <Search
            size={15}
            className="text-text-muted/40 group-focus-within:text-primary-main transition-colors shrink-0"
          />
          <input
            type="text"
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-[13px] font-semibold text-text-main placeholder:text-text-muted/40 focus:outline-none"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="shrink-0 text-text-muted/40 hover:text-text-main transition-colors active:scale-90"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* ── Notification bell ── */}
        <div className="relative shrink-0">
          <button
            onClick={onToggleNotifs}
            className={clsx(
              'pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90',
              GLASS,
              showNotifs
                ? 'text-primary-main ring-2 ring-primary-main/25'
                : 'text-text-secondary hover:text-text-main',
            )}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] flex items-center justify-center bg-primary-main text-white text-[9px] font-bold rounded-full border-2 border-bg-base">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div className="fixed inset-0 z-[300] flex items-start justify-end pt-16 pr-3 md:pt-[72px] md:pr-5 bg-black/40 backdrop-blur-sm pointer-events-auto">
              <div className="absolute inset-0" onClick={onToggleNotifs} />

              <div className="relative w-full max-w-sm bg-surface-card border border-border-subtle/30 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle/30 bg-bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-primary-main" />
                    <span className="text-[13px] font-black text-text-main uppercase tracking-tight">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <Badge variant="primary" className="text-[10px] px-1.5 py-0.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onMarkAllRead}
                      className="text-[11px] text-primary-main font-bold hover:underline uppercase tracking-wider"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={onToggleNotifs}
                      className="text-text-muted hover:text-text-main transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-border-subtle/20 no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-bg-secondary/50 flex items-center justify-center text-text-muted/20">
                        <Bell size={22} />
                      </div>
                      <p className="text-[12px] font-bold text-text-muted/40 uppercase tracking-widest">
                        All clear
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={clsx(
                          'px-5 py-4 hover:bg-bg-secondary/40 cursor-pointer transition-colors',
                          !n.isRead && 'bg-primary-main/[0.03]',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={clsx(
                              'text-[13px] font-bold leading-tight',
                              !n.isRead ? 'text-text-main' : 'text-text-muted',
                            )}
                          >
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <div className="w-2 h-2 bg-primary-main rounded-full mt-1.5 shrink-0 shadow-sm shadow-primary-main/50" />
                          )}
                        </div>
                        <p className="text-[12px] text-text-muted/60 mt-1.5 line-clamp-2 leading-relaxed font-medium">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-text-muted/30 mt-2 font-bold uppercase tracking-tighter">
                          Just now
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-bg-secondary/10 border-t border-border-subtle/30 text-center">
                  <button
                    onClick={() => { navigate('/notifications'); onToggleNotifs(); }}
                    className="text-[11px] font-black text-primary-main uppercase tracking-widest hover:underline"
                  >
                    View All Alerts
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

