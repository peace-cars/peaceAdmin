import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  role: string | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ role }) => {
  const isGM = role === 'GENERAL_MANAGER';

  const navItems = [
    { id: 'dash', label: 'Home', icon: LayoutDashboard, path: '/', exact: true },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, path: '/acquisitions' },
    { id: 'assets', label: 'Assets', icon: Package, path: '/inventory' },
    { id: 'finances', label: 'Finance', icon: DollarSign, path: '/budgets' },
    { id: 'team', label: 'Team', icon: Users, path: '/staff' },
  ];

  if (isGM) {
    navItems.push({ id: 'vault', label: 'Vault', icon: Shield, path: '/vault' });
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 w-full bg-surface-card border-t border-border-subtle z-[100] px-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center py-2 px-3 min-w-[48px] min-h-[48px] transition-colors relative",
              isActive ? "text-primary-main" : "text-text-muted"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className="mb-0.5" />
                <span className={cn(
                  "text-[11px]",
                  isActive ? "font-semibold" : "font-medium"
                )}>
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
