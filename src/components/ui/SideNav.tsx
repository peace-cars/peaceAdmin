import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  TrendingUp,
  Layers,
  LogOut,
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  UserPlus,
  DollarSign,
  Calculator,
  FileSearch,
  HardDrive,
  MessageSquare,
  Bell,
  X,
  Settings,
  Download,
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';

import logo from '../../assets/logo.png';

interface SideNavProps {
  role: string | null;
  onLogout: () => void;
  isCollapsed?: boolean;
  scope?: any;
  onNavigate?: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  role,
  onLogout,
  isCollapsed = false,
  scope,
  onNavigate,
}) => {
  const location = useLocation();
  const { isInstallable, installApp } = usePwaInstall();
  const roleLabel = role?.replace(/_/g, ' ') || 'Manager';

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({
    to,
    icon: Icon,
    label,
    hidden = false,
  }: {
    to: string;
    icon: any;
    label: string;
    hidden?: boolean;
  }) => {
    if (hidden) return null;
    return (
      <Link
        to={to}
        onClick={() => onNavigate?.()}
        title={isCollapsed ? label : ''}
        className={clsx(
          'flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent',
          isCollapsed ? 'justify-center' : '',
          isActive(to)
            ? 'bg-primary-main text-white font-semibold shadow-lg shadow-primary-main/20'
            : 'text-text-secondary hover:bg-white/10 hover:text-text-main hover:border-white/10',
        )}
      >
        <Icon
          size={20}
          className={clsx('shrink-0', isActive(to) ? 'text-white' : 'text-text-secondary')}
        />
        {!isCollapsed && <span className="text-[14px] font-medium truncate">{label}</span>}
      </Link>
    );
  };


  return (
    <aside
      className={clsx(
        'relative overflow-hidden border-r border-white/15 bg-white/70 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/8',
        'flex h-full flex-col pt-[calc(1.5rem+env(safe-area-inset-top))] transition-all overflow-y-auto no-scrollbar',
        isCollapsed ? 'px-2' : 'px-3',
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-none bg-[linear-gradient(135deg,rgba(255,255,255,0.60),rgba(255,255,255,0.18)_35%,rgba(255,255,255,0.05)_65%,transparent_100%)] opacity-90 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06)_35%,rgba(255,255,255,0.02)_65%,transparent_100%)]" />

      {/* Header with close button for mobile */}
      <div
        className={clsx(
          'flex items-center justify-between mb-6',
          isCollapsed ? 'px-0 justify-center' : 'px-2',
        )}
      >
        <div className={clsx('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <img src={logo} alt="Peace Cars" className="w-full h-full object-contain p-0.5" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="text-[16px] font-bold text-text-main tracking-tight block">
                PeaceCars
              </span>
              <span className="text-[11px] font-medium text-primary-main capitalize">
                {roleLabel.toLowerCase()}
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && onNavigate && (
          <button
            onClick={onNavigate}
            className="p-2 rounded-xl hover:bg-white/10 lg:hidden active:scale-95 transition-all"
          >
            <X size={20} className="text-text-muted" />
          </button>
        )}
      </div>

      {/* Scope Indicator */}
      {!isCollapsed && scope && (
        <div className="mx-2 mb-4 p-3 bg-white/10 border border-white/10 rounded-xl flex items-center gap-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
          <ShieldCheck size={16} className="text-primary-main shrink-0" />
          <span className="text-[12px] font-medium text-text-secondary">
            {role === 'GENERAL_MANAGER'
              ? 'Global Access'
              : role === 'DISTRICT_MANAGER'
                ? 'District Scope'
                : 'Branch Scope'}
          </span>
          {role === 'DISTRICT_MANAGER' && scope.scopedBranchIds && (
            <span className="text-[11px] font-mono bg-surface-card border border-border-subtle px-1.5 py-0.5 rounded-md ml-auto">
              {scope.scopedBranchIds.length}
            </span>
          )}
        </div>
      )}

      <nav className="grow space-y-0.5">
        {!isCollapsed && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted px-3 pb-2">
            Menu
          </p>
        )}
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/acquisitions" icon={TrendingUp} label="Pipeline" />
        <NavItem to="/custom-orders" icon={Building2} label="Sourcing" />
        <NavItem
          to="/inventory"
          icon={Layers}
          label="Inventory"
          hidden={!(role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER')}
        />
        <NavItem to="/inbox" icon={MessageSquare} label="Inbox" />
        <NavItem to="/notifications" icon={Bell} label="Registry Pulse" />
        <NavItem to="/settings" icon={Settings} label="Settings" />

        {!isCollapsed && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted px-3 pt-5 pb-2">
            Finance
          </p>
        )}
        <NavItem
          to="/finance"
          icon={Calculator}
          label="Auto Loans"
          hidden={
            !(
              role === 'DISTRICT_MANAGER' ||
              role === 'GENERAL_MANAGER' ||
              role === 'FINANCE_AUDITOR'
            )
          }
        />
        <NavItem
          to="/budgets"
          icon={DollarSign}
          label="Budgets"
          hidden={
            !(
              role === 'DISTRICT_MANAGER' ||
              role === 'GENERAL_MANAGER' ||
              role === 'FINANCE_AUDITOR'
            )
          }
        />
        <NavItem to="/commissions" icon={TrendingUp} label="Commissions" />
        <NavItem to="/inspections" icon={FileSearch} label="Inspections" />
        <NavItem
          to="/archive"
          icon={HardDrive}
          label="Sold Archive"
          hidden={
            !(
              role === 'DISTRICT_MANAGER' ||
              role === 'GENERAL_MANAGER' ||
              role === 'FINANCE_AUDITOR'
            )
          }
        />

        {!isCollapsed && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted px-3 pt-5 pb-2">
            Team
          </p>
        )}
        <NavItem to="/staff" icon={Users} label="Staff Roster" />

        {role === 'GENERAL_MANAGER' && (
          <>
            <NavItem to="/branches" icon={MapPin} label="Branches" />
            <NavItem to="/people" icon={UserPlus} label="Users" />
            <NavItem to="/library" icon={HardDrive} label="Assets" />
          </>
        )}
      </nav>

      {/* Settings shortcut footer */}
      {!isCollapsed && (
        <div className="px-2 py-3 border-t border-border-subtle">
          <Link
            to="/settings"
            onClick={() => onNavigate?.()}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all border border-transparent text-text-secondary hover:bg-white/10 hover:text-text-main hover:border-white/10',
              location.pathname === '/settings' && 'bg-primary-main text-white font-semibold shadow-lg shadow-primary-main/20',
            )}
          >
            <Settings size={18} className="shrink-0" />
            <span className="text-[14px] font-medium">Settings</span>
          </Link>
        </div>
      )}

      {/* Install App */}
      {isInstallable && (
        <div className={clsx('pb-3 pt-2', isCollapsed ? 'px-0' : 'px-2')}>
          <button
            onClick={installApp}
            className={clsx(
              'flex items-center gap-2.5 bg-primary-main/10 rounded-xl text-[14px] font-bold text-primary-main hover:bg-primary-main/20 transition-all border border-primary-main/20 active:scale-[0.97]',
              isCollapsed ? 'justify-center p-3' : 'w-full p-3',
            )}
          >
            <Download size={18} />
            {!isCollapsed && <span>Install App</span>}
          </button>
        </div>
      )}

      {/* Logout */}
      <div className={clsx('pb-6 pt-2', isCollapsed ? 'px-0' : 'px-2')}>
        <button
          onClick={onLogout}
          className={clsx(
            'flex items-center gap-2.5 bg-white/8 rounded-xl text-[14px] font-medium text-text-secondary hover:bg-error/10 hover:text-error transition-all border border-white/10 active:scale-[0.97]',
            isCollapsed ? 'justify-center p-3' : 'w-full p-3',
          )}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
