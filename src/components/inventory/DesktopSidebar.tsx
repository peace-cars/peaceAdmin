import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface DesktopSidebarProps {
  totalValue: number;
  branchCount: number;
  onAdd: () => void;
  onRefresh: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  totalValue,
  branchCount,
  onAdd,
  onRefresh,
}) => (
  <aside className="hidden space-y-6 xl:block">
    <div className="rounded-[30px] border border-border-subtle/70 bg-surface-card/95 p-5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        Control Center
      </p>
      <h3 className="mt-2 text-lg font-black tracking-tight text-text-main">Branch Overview</h3>
      <p className="mt-2 text-[13px] text-text-muted/80">
        Manage your entire vehicle portfolio from one unified control point.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border-subtle/60 bg-bg-secondary/60 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Total Value
          </p>
          <p className="mt-1 text-lg font-black text-text-main">
            {(totalValue / 1000000).toFixed(1)}M ETB
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle/60 bg-bg-secondary/60 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Active Hubs
          </p>
          <p className="mt-1 text-lg font-black text-text-main">{branchCount}</p>
        </div>
      </div>
    </div>

    <div className="rounded-[30px] border border-border-subtle/70 bg-surface-card/95 p-5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        Quick Actions
      </p>
      <div className="mt-4 space-y-3">
        <Button
          variant="primary"
          className="h-12 w-full shadow-lg shadow-primary-main/20"
          onClick={onAdd}
        >
          <Plus size={16} className="mr-2" /> Register Asset
        </Button>
        <Button variant="outline" className="h-12 w-full" onClick={onRefresh}>
          Refresh Registry
        </Button>
      </div>
    </div>
  </aside>
);
