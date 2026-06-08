import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, TrendingUp, DollarSign, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  role: string | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ role }) => {
  const navItems = [
    { id: 'dash', label: 'Home', icon: LayoutDashboard, path: '/', exact: true },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, path: '/acquisitions' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/inbox' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory' },
    { id: 'finances', label: 'Finance', icon: DollarSign, path: '/budgets' },
  ];

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-100 px-3 pb-2 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 8px)' }}
    >
      <div className="relative mx-auto flex w-full max-w-md items-center justify-around overflow-hidden rounded-[30px] border border-white/25 bg-white/70 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.75)] backdrop-blur-2xl supports-backdrop-filter:bg-white/70 dark:border-white/10 dark:bg-white/8 dark:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.92)]">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'pointer-events-auto flex flex-1 flex-col items-center justify-center rounded-[20px] px-2 py-2.5 min-h-14 transition-all duration-200',
                isActive
                  ? 'bg-white/35 text-primary-main shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:bg-white/12 dark:text-primary-main'
                  : 'text-text-secondary hover:bg-white/20 hover:text-text-main dark:text-text-secondary dark:hover:bg-white/10 dark:hover:text-text-main',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={cn(
                    'mb-1 transition-all duration-200',
                    isActive ? 'scale-110' : 'scale-100',
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] leading-none',
                    isActive ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
