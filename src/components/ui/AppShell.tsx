import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SideNav } from './SideNav';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { motion } from 'framer-motion';

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
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLElement>(null);

  const showBackButton =
    location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/signup';

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

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-full overflow-hidden relative">
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



        {/* Scrollable Content */}
        <section
          ref={contentRef}
          tabIndex={-1}
          className="flex-grow overflow-y-auto overflow-x-clip no-scrollbar scroll-smooth"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="px-4 md:px-8 py-5 md:py-8 max-w-[1400px] mx-auto w-full"
          >
            {children}
          </motion.div>

          {/* Bottom spacer for BottomNav */}
          <div className="h-28 lg:h-8" />
        </section>

        {!isMobileMenuOpen && <BottomNav role={role} />}
      </main>
    </div>
  );
};
