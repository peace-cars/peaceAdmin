import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';

interface AppShellProps {
  user: any;
  role: string | null;
  notifications: any[];
  showNotifs: boolean;
  scope?: any;
  onToggleNotifs: () => void;
  onMarkAllRead: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  role,
  notifications,
  showNotifs,
  scope,
  onToggleNotifs,
  onMarkAllRead,
  onLogout,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const contentRef = useRef<HTMLElement>(null);

  const { bgGradient } = useTheme();

  const gradientClass = {
    'default': 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0033FF]/20 via-[#0033FF]/5 to-transparent dark:from-[#0033FF]/40 dark:via-[#020A2F] dark:to-[#050511]',
    'light-blue': 'bg-gradient-to-b from-sky-200/50 via-sky-50/10 to-transparent dark:from-[#0e274c] dark:via-[#030d1f] dark:to-[#000000]',
    'light-emerald': 'bg-gradient-to-b from-emerald-200/40 via-emerald-50/10 to-transparent dark:from-[#082a1d] dark:via-[#020f0a] dark:to-[#000000]',
    'light-purple': 'bg-gradient-to-b from-purple-200/40 via-purple-50/10 to-transparent dark:from-[#21093b] dark:via-[#0c0316] dark:to-[#000000]',
    'light-coral': 'bg-gradient-to-b from-rose-200/40 via-rose-50/10 to-transparent dark:from-[#3a0b12] dark:via-[#160205] dark:to-[#000000]',
    'solid-white': 'bg-[#FFFFFF] dark:bg-[#121212]',
    'solid-slate': 'bg-[#F1F5F9] dark:bg-[#0F172A]',
    'solid-blue': 'bg-[#E0F2FE] dark:bg-[#082F49]',
  }[bgGradient] || 'bg-gradient-to-b from-sky-200/50 via-sky-50/10 to-transparent dark:from-[#0e274c] dark:via-[#030d1f] dark:to-[#000000]';


  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
    contentRef.current?.focus();
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="flex h-screen bg-bg-base text-text-main font-sans overflow-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-all duration-700">
        <div className={cn("absolute inset-0 transition-all duration-700", gradientClass)} />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[150] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        className="fixed inset-y-0 left-0 w-[280px] bg-bg-sidebar z-[160] lg:hidden shadow-2xl"
      >
        <SideNav
          role={role}
          onLogout={onLogout}
          isCollapsed={false}
          scope={scope}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />
      </motion.div>

      {/* Desktop SideNav */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="hidden lg:block h-full relative z-20 border-r border-border-subtle bg-bg-sidebar"
      >
        <SideNav role={role} onLogout={onLogout} isCollapsed={isCollapsed} scope={scope} />
      </motion.div>

      {/* Main Content — relative so TopNav can be absolute-positioned over it */}
      <main className="flex-grow flex flex-col h-full overflow-hidden relative z-10">
        {/* TopNav floats absolutely at top — content scrolls underneath */}
        <div id="admin-top-nav" className="absolute top-0 left-0 right-0 z-[100] pointer-events-none">
          <TopNav
            user={user}
            role={role}
            notifications={notifications}
            showNotifs={showNotifs}
            scope={scope}
            onToggleNotifs={onToggleNotifs}
            onMarkAllRead={onMarkAllRead}
            onToggleSidebar={handleToggleSidebar}
          />
        </div>

        {/* Scrollable Content — padding-top clears the floating TopNav */}
        <section
          ref={contentRef}
          tabIndex={-1}
          className="flex-grow overflow-y-auto overflow-x-clip no-scrollbar scroll-smooth"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ paddingTop: 'calc(3.75rem + env(safe-area-inset-top, 0px))' }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="px-4 md:px-8 pt-1 pb-5 md:pt-4 md:pb-8 max-w-[1400px] mx-auto w-full"
          >
            {children}
          </motion.div>

          {/* Bottom spacer for BottomNav */}
          <div className="h-28 lg:h-8" />
        </section>

        <div id="admin-bottom-nav">
          {!isMobileMenuOpen && <BottomNav role={role} />}
        </div>
      </main>

      {/* Style tester removed — controls are now in /settings */}
    </div>
  );
};
