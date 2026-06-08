/**
 * BudgetManager.tsx
 *
 * Componentized for maintainability. Sub-components:
 *   BudgetKpis, StatusBadge, BudgetCard, BudgetDetailModal
 *
 * All original functionality is preserved.
 * Bottom "MTD Disbursement / Financial Integrity" footer removed per design brief.
 */

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Clock,
  DollarSign,
  Activity,
  ShieldCheck,
  Building2,
  User,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Safely replace underscores with spaces without regex literal */
function roleLabel(role: string): string {
  return role.split('_').join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Status badge
// ─────────────────────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'DISBURSED') {
    return (
      <span className="bg-success/10 text-success px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-success/20">
        Paid
      </span>
    );
  }
  if (status === 'APPROVED') {
    return (
      <span className="bg-primary-main/10 text-primary-main px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-primary-main/20">
        Approved
      </span>
    );
  }
  if (status === 'REQUESTED') {
    return (
      <span className="bg-warning/10 text-warning px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-warning/20">
        Pending
      </span>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile KPI cards
// ─────────────────────────────────────────────────────────────────────────────
interface BudgetKpisProps {
  pendingTotal: number;
  approvedTotal: number;
  paidMtd: number;
  activeBranches: number;
}

const BudgetKpis: React.FC<BudgetKpisProps> = ({
  pendingTotal,
  approvedTotal,
  paidMtd,
  activeBranches,
}) => (
  <div className="flex flex-col gap-3">
    {/* Primary card — total approved with wave */}
    <div className="bg-surface-card rounded-[20px] shadow-sm border border-border-subtle/30 overflow-hidden relative">
      <div className="p-5 pb-14">
        <div className="flex justify-between items-start">
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
            Approved Funds
          </p>
          <ShieldCheck size={16} className="text-text-muted" />
        </div>
        <p className="mt-2 text-[26px] font-black tracking-tight text-text-main">
          {(approvedTotal / 1000).toFixed(1)}K
          <span className="text-[14px] font-bold text-text-muted ml-2">ETB</span>
        </p>
      </div>
      {/* Wave chart approximation */}
      <div className="absolute bottom-0 left-0 w-full h-14 overflow-hidden">
        <svg
          viewBox="0 0 400 48"
          preserveAspectRatio="none"
          className="w-full h-full text-primary-main"
        >
          <path
            d="M0,38 C70,20 140,42 200,26 C260,10 320,36 370,22 C385,16 395,24 400,20 L400,48 L0,48 Z"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <path
            d="M0,38 C70,20 140,42 200,26 C260,10 320,36 370,22 C385,16 395,24 400,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </div>

    {/* 2×2 KPI grid */}
    <div className="grid grid-cols-2 gap-3">
      {[
        {
          label: 'Pending Review',
          value: `${(pendingTotal / 1000).toFixed(1)}K`,
          icon: <AlertTriangle size={14} />,
          color: 'text-amber-400',
        },
        {
          label: 'Paid (MTD)',
          value: `${(paidMtd / 1000).toFixed(1)}K`,
          icon: <CheckCircle2 size={14} />,
          color: 'text-emerald-400',
        },
        {
          label: 'Active Branches',
          value: String(activeBranches),
          icon: <Building2 size={14} />,
          color: 'text-blue-400',
        },
        {
          label: 'Total Funds',
          value: `${((pendingTotal + approvedTotal + paidMtd) / 1000).toFixed(1)}K`,
          icon: <TrendingUp size={14} />,
          color: 'text-text-muted',
        },
      ].map(({ label, value, icon, color }) => (
        <div
          key={label}
          className="bg-surface-card rounded-[16px] p-4 shadow-sm border border-border-subtle/30 flex flex-col"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
              {label}
            </p>
            <span className={color}>{icon}</span>
          </div>
          <p className="mt-2 text-[15px] font-black tracking-tight text-text-main">{value}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Single budget request card
// ─────────────────────────────────────────────────────────────────────────────
interface BudgetCardProps {
  b: any;
  role: string | null;
  onReview: () => void;
  onApprove: () => void;
  onDisburse: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ b, role, onReview, onApprove, onDisburse }) => {
  const canApprove =
    b.status === 'REQUESTED' && (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER');
  const canDisburse =
    b.status === 'APPROVED' && (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR');

  return (
    <div
      className={cn(
        'bg-surface-card rounded-2xl shadow-sm border border-border-subtle hover:shadow-md hover:-translate-y-0.5 p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 group transition-all relative overflow-hidden',
        b.status === 'DISBURSED' && 'opacity-60 grayscale-[0.3]',
      )}
    >
      {/* Swipe hint gradient (mobile) */}
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-indigo-50 to-transparent opacity-0 group-active:opacity-100 transition-opacity pointer-events-none md:hidden" />

      {/* Left: Avatar + info */}
      <div className="flex gap-4 flex-1 min-w-0">
        <div
          className={cn(
            'w-11 h-11 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 font-bold text-lg shadow-sm shrink-0',
            b.status === 'REQUESTED'
              ? 'bg-warning/10 border-warning/20 text-warning'
              : b.status === 'APPROVED'
                ? 'bg-primary-main border-primary-main text-white'
                : 'bg-bg-secondary border-border-subtle text-text-muted',
          )}
        >
          {b.profiles?.full_name?.charAt(0) || <User size={18} />}
        </div>

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[13px] md:text-lg font-bold text-text-main tracking-tight group-hover:text-primary-main transition-colors truncate">
              {b.purpose}
            </h3>
            <StatusBadge status={b.status} />
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-text-muted pb-0.5">
            <div className="shrink-0 flex items-center gap-1.5 bg-bg-secondary px-2.5 py-1 rounded-lg border border-border-subtle text-text-secondary">
              <User size={10} className="text-primary-main/60" />
              {b.profiles?.full_name || 'Staff Member'}
            </div>
            <div className="shrink-0 flex items-center gap-1.5 bg-bg-secondary px-2.5 py-1 rounded-lg border border-border-subtle text-text-secondary">
              <ShieldCheck size={10} className="text-primary-main/60" />
              {roleLabel(b.profiles?.role || 'STAFF')}
            </div>
            <div className="shrink-0 flex items-center text-text-muted/40 font-mono text-[10px]">
              ID: {b.id.substring(0, 8).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Amount + actions */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 shrink-0 pt-3 md:pt-0 border-t border-border-subtle/30 md:border-t-0">
        <div className="flex items-center justify-between md:block">
          <div>
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">
              {b.status === 'APPROVED' ? 'Approved' : 'Requested'}
            </p>
            <p className="text-xl md:text-3xl font-black text-primary-main md:text-text-main tracking-tight">
              {(b.amount_approved || b.amount_requested).toLocaleString()}
              <span className="text-[11px] font-bold ml-1.5 uppercase opacity-80">ETB</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
          {canApprove && (
            <Button
              variant="primary"
              size="sm"
              className="col-span-1 h-11 rounded-xl text-[12px] font-bold uppercase tracking-wider shadow-md active:scale-95"
              onClick={onApprove}
            >
              Approve
            </Button>
          )}
          {canDisburse && (
            <Button
              variant="primary"
              size="sm"
              className="col-span-1 h-11 rounded-xl text-[12px] font-bold uppercase tracking-wider shadow-md bg-success hover:bg-success/80 text-white active:scale-95"
              onClick={onDisburse}
            >
              Mark Paid
            </Button>
          )}
          <button
            onClick={onReview}
            className={cn(
              'h-11 flex items-center justify-center gap-2 rounded-xl bg-bg-secondary text-text-muted hover:text-primary-main hover:bg-primary-main/10 transition-all border border-border-subtle shadow-sm text-[12px] font-bold',
              canApprove || canDisburse
                ? 'col-span-1 w-full md:w-11'
                : 'col-span-2 w-full md:w-11',
            )}
          >
            <span className="md:hidden">Review</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Budget detail modal
// ─────────────────────────────────────────────────────────────────────────────
interface BudgetDetailModalProps {
  budget: any;
  role: string | null;
  onClose: () => void;
  onApprove: (id: string, amount: number) => void;
  onDisburse: (id: string) => void;
}

const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  budget,
  role,
  onClose,
  onApprove,
  onDisburse,
}) => (
  <Modal
    isOpen={!!budget}
    onClose={onClose}
    title="Finance Request Profile"
    subtitle={`Reference: ${budget?.id?.substring(0, 12).toUpperCase() || 'N/A'}`}
    maxWidth="max-w-2xl"
  >
    {budget && (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-bg-secondary rounded-2xl border border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-card rounded-xl shadow-sm border border-border-subtle flex items-center justify-center text-primary-main font-bold text-lg">
              {budget.profiles?.full_name?.charAt(0) || <User size={24} />}
            </div>
            <div>
              <p className="text-lg font-bold text-text-main tracking-tight">{budget.purpose}</p>
              <p className="text-[13px] font-bold text-text-muted">
                Requested by {budget.profiles?.full_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-bold text-text-muted mb-1">Requested Sum</p>
            <p className="text-2xl font-bold text-text-main tracking-tight">
              {budget.amount_requested.toLocaleString()}
              <span className="text-[13px] text-primary-main font-mono ml-1">ETB</span>
            </p>
          </div>
        </div>

        {/* Status + Date */}
        <div className="grid grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border border-border-subtle bg-bg-secondary/30 space-y-1">
            <p className="text-[12px] font-bold text-text-muted">Current Status</p>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  budget.status === 'REQUESTED'
                    ? 'bg-warning'
                    : budget.status === 'APPROVED'
                      ? 'bg-primary-main'
                      : 'bg-success',
                )}
              />
              <p className="text-sm font-bold text-text-main uppercase tracking-tight">
                {budget.status}
              </p>
            </div>
          </div>
          <div className="p-5 rounded-2xl border border-border-subtle bg-bg-secondary/30 space-y-1">
            <p className="text-[12px] font-bold text-text-muted">Submission Date</p>
            <p className="text-sm font-bold text-text-main tracking-tight">
              {new Date(budget.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Audit timeline */}
        <div className="space-y-4">
          <h4 className="text-[13px] font-bold text-text-muted uppercase tracking-wider">
            Audit Timeline
          </h4>
          <div className="pl-4 border-l-2 border-border-subtle ml-2 space-y-0">
            <div className="relative pl-6 pb-6">
              <div className="absolute w-3 h-3 bg-primary-main rounded-full -left-[7px] top-1 shadow-md border-2 border-bg" />
              <p className="text-sm font-bold text-text-main leading-none">Request Logged</p>
              <p className="text-[13px] text-text-muted mt-1">
                Initiated by staff member in field registry
              </p>
            </div>
            <div
              className={cn(
                'relative pl-6 pb-6',
                budget.status === 'REQUESTED' && 'opacity-40',
              )}
            >
              <div
                className={cn(
                  'absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-bg',
                  budget.status === 'APPROVED' || budget.status === 'DISBURSED'
                    ? 'bg-primary-main'
                    : 'bg-border-subtle',
                )}
              />
              <p className="text-sm font-bold text-text-main leading-none">
                Managerial Authorization
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                {budget.status !== 'REQUESTED'
                  ? 'Budget approved and reserved'
                  : 'Awaiting senior review'}
              </p>
            </div>
            <div
              className={cn('relative pl-6', budget.status !== 'DISBURSED' && 'opacity-40')}
            >
              <div
                className={cn(
                  'absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-bg',
                  budget.status === 'DISBURSED' ? 'bg-success' : 'bg-border-subtle',
                )}
              />
              <p className="text-sm font-bold text-text-main leading-none">Funds Settlement</p>
              <p className="text-[13px] text-text-muted mt-1">
                {budget.status === 'DISBURSED'
                  ? 'Disbursement completed'
                  : 'Pending final payout'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-border-subtle flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close Profile
          </Button>
          {budget.status === 'REQUESTED' &&
            (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER') && (
              <Button
                variant="primary"
                onClick={() => {
                  const amt = prompt('Approve Amount (ETB):', budget.amount_requested.toString());
                  if (amt) {
                    onApprove(budget.id, Number(amt));
                    onClose();
                  }
                }}
              >
                Approve Funds
              </Button>
            )}
          {budget.status === 'APPROVED' &&
            (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
              <Button
                variant="primary"
                className="bg-success hover:bg-success/80 text-white"
                onClick={() => {
                  if (window.confirm('Confirm disbursement?')) {
                    onDisburse(budget.id);
                    onClose();
                  }
                }}
              >
                Mark as Paid
              </Button>
            )}
        </div>
      </div>
    )}
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Request queue list
// ─────────────────────────────────────────────────────────────────────────────
interface RequestQueueProps {
  budgets: any[];
  role: string | null;
  onReview: (b: any) => void;
  onApprove: (id: string, amount: number) => void;
  onDisburse: (id: string) => void;
}

const RequestQueue: React.FC<RequestQueueProps> = ({
  budgets,
  role,
  onReview,
  onApprove,
  onDisburse,
}) => {
  if (budgets.length === 0) {
    return (
      <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle border-dashed py-24 text-center">
        <Activity className="mx-auto text-text-muted/20 mb-4" size={48} />
        <p className="text-text-muted font-bold uppercase tracking-wider text-[13px]">
          No pending finance requests.
        </p>
      </div>
    );
  }

  const sorted = [...budgets].sort((a, b) => {
    if (a.status === 'REQUESTED' && b.status !== 'REQUESTED') return -1;
    if (a.status !== 'REQUESTED' && b.status === 'REQUESTED') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="grid grid-cols-1 gap-4">
      {sorted.map((b) => (
        <BudgetCard
          key={b.id}
          b={b}
          role={role}
          onReview={() => onReview(b)}
          onApprove={() => {
            const amt = prompt('Approve Amount (ETB):', b.amount_requested.toString());
            if (amt) onApprove(b.id, Number(amt));
          }}
          onDisburse={() => {
            if (window.confirm('Confirm disbursement of these funds?')) onDisburse(b.id);
          }}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function BudgetManager() {
  const { session } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const role = localStorage.getItem('admin_role');

  const fetchBudgets = async () => {
    if (!session) return;
    try {
      const data = await api.get<any[]>('/staff-budgets');
      setBudgets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [session]);

  const approveBudget = async (id: string, amount: number) => {
    if (!session) return;
    try {
      await api.patch(`/staff-budgets/${id}/approve`, { amount });
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: 'APPROVED', amount_approved: amount } : b,
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const disburseBudget = async (id: string) => {
    if (!session) return;
    try {
      await api.patch(`/staff-budgets/${id}/disburse`, {});
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'DISBURSED' } : b)),
      );
    } catch (e) {
      console.error(e);
    }
  };

  // KPI derivations
  const pendingReviewTotal = budgets
    .filter((b) => b.status === 'REQUESTED')
    .reduce((s, b) => s + b.amount_requested, 0);
  const approvedTotal = budgets
    .filter((b) => b.status === 'APPROVED')
    .reduce((s, b) => s + (b.amount_approved || b.amount_requested), 0);
  const totalPaidMtd = budgets
    .filter(
      (b) =>
        b.status === 'DISBURSED' &&
        new Date(b.created_at).getMonth() === new Date().getMonth(),
    )
    .reduce((s, b) => s + (b.amount_approved || b.amount_requested), 0);
  const activeLocationsCount = new Set(
    budgets.map((b) => b.profiles?.branch_id).filter(Boolean),
  ).size;

  return (
    <div className="space-y-6 pb-24 animate-fade-in">

      {/* ─── DESKTOP STICKY HEADER ─── */}
      <div className="hidden md:block sticky top-0 z-30 -mx-4 md:-mx-8 -mt-5 md:-mt-8 border-b border-border-subtle/30 bg-bg-base/95 px-4 py-4 shadow-sm backdrop-blur-md md:px-8">
        <div className="rounded-[28px] border border-border-subtle/70 bg-surface-card/95 p-4 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calculator size={22} className="text-primary-main" />
              <h1 className="text-xl font-black text-text-main tracking-tight">
                Budget Manager
              </h1>
            </div>
            <div className="flex items-center gap-4 text-[12px] font-bold text-text-muted">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-warning" /> Pending
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-main" /> Approved
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" /> Paid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP KPI GRID ─── */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTile
          label="Pending Review"
          value={`${(pendingReviewTotal / 1000).toFixed(1)}K`}
          icon={<Clock size={14} />}
          color="amber"
          className="p-6 h-32"
        />
        <KpiTile
          label="Approved Funds"
          value={`${(approvedTotal / 1000).toFixed(1)}K`}
          icon={<ShieldCheck size={14} />}
          color="indigo"
          className="p-6 h-32"
        />
        <KpiTile
          label="Total Paid (MTD)"
          value={`${(totalPaidMtd / 1000).toFixed(1)}K`}
          icon={<DollarSign size={14} />}
          color="emerald"
          className="p-6 h-32"
        />
        <KpiTile
          label="Active Branches"
          value={activeLocationsCount.toString()}
          icon={<Building2 size={14} />}
          color="indigo"
          className="p-6 h-32"
        />
      </div>

      {/* ══════════════════════════════════════
          MOBILE SECTION
      ══════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-4">

        {/* ── Single sticky banner: ALL BRANCHES + Finance Ledger title ── */}
        <div className="sticky top-0 z-40 bg-bg-base -mx-4 px-4 pb-2">
          {/* Row 1: Branch label (set from Dashboard) */}
          <div className="h-[40px] flex items-center">
            <span className="text-text-main font-black uppercase tracking-wide text-[16px]">
              {localStorage.getItem('admin_selected_branch_name') || 'ALL BRANCHES'}
            </span>
          </div>
          {/* Row 2: Finance Ledger card */}
          <div className="bg-surface-card rounded-[16px] px-4 py-3 shadow-sm border border-border-subtle/30 flex items-center gap-3">
            <Calculator size={20} className="text-[#1976d2] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black tracking-tight text-text-main">
                Finance Ledger
              </p>
              <p className="text-[10px] text-text-muted font-medium truncate">
                Staff budget requests and disbursement approvals
              </p>
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
        </div>

        {/* Mobile KPI cards */}
        <BudgetKpis
          pendingTotal={pendingReviewTotal}
          approvedTotal={approvedTotal}
          paidMtd={totalPaidMtd}
          activeBranches={activeLocationsCount}
        />
      </div>

      {/* ─── REQUEST QUEUE (both mobile + desktop) ─── */}
      <div className="space-y-4">
        {/* Section header — desktop only */}
        <div className="hidden md:flex items-center justify-between px-1">
          <h2 className="text-[13px] font-bold text-text-main">Request Queue</h2>
          <div className="flex items-center gap-4 text-[12px] font-bold text-text-muted">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-warning" /> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-main" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" /> Paid
            </span>
          </div>
        </div>

        <RequestQueue
          budgets={budgets}
          role={role}
          onReview={setSelectedBudget}
          onApprove={approveBudget}
          onDisburse={disburseBudget}
        />
      </div>

      {/* ─── BUDGET DETAIL MODAL ─── */}
      <BudgetDetailModal
        budget={selectedBudget}
        role={role}
        onClose={() => setSelectedBudget(null)}
        onApprove={approveBudget}
        onDisburse={disburseBudget}
      />
    </div>
  );
}
