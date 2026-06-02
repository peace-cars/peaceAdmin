import { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCircle2,
  Clock,
  DollarSign,
  Activity,
  ShieldCheck,
  Building2,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { KpiTile } from '../components/ui/KpiTile';
import { SectionCard } from '../components/ui/SectionCard';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

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
        prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED', amount_approved: amount } : b)),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const disburseBudget = async (id: string) => {
    if (!session) return;
    try {
      await api.patch(`/staff-budgets/${id}/disburse`, {});
      setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'DISBURSED' } : b)));
    } catch (e) {
      console.error(e);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'DISBURSED':
        return (
          <span className="bg-success/10 text-success px-2.5 py-1 rounded-lg text-[13px] font-bold uppercase tracking-wider border border-success/20">
            Paid
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-primary-main/10 text-primary-main px-2.5 py-1 rounded-lg text-[13px] font-bold uppercase tracking-wider border border-primary-main/20">
            Approved
          </span>
        );
      case 'REQUESTED':
        return (
          <span className="bg-warning/10 text-warning px-2.5 py-1 rounded-lg text-[13px] font-bold uppercase tracking-wider border border-warning/20">
            Pending Review
          </span>
        );
      default:
        return null;
    }
  };

  const pendingReviewTotal = budgets
    .filter((b) => b.status === 'REQUESTED')
    .reduce((s, b) => s + b.amount_requested, 0);
  const approvedTotal = budgets
    .filter((b) => b.status === 'APPROVED')
    .reduce((s, b) => s + (b.amount_approved || b.amount_requested), 0);
  const totalPaidMtd = budgets
    .filter(
      (b) =>
        b.status === 'DISBURSED' && new Date(b.created_at).getMonth() === new Date().getMonth(),
    )
    .reduce((s, b) => s + (b.amount_approved || b.amount_requested), 0);
  const activeLocationsCount = new Set(budgets.map((b) => b.branch_id)).size;

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="space-y-6">
        <div className="flex flex-col gap-1.5 px-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-text-main font-semibold">Request Queue</h2>
            <div className="flex items-center gap-4 text-[12px] font-bold text-text-muted font-medium">
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
        </div>

        {budgets.length === 0 ? (
          <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle border-dashed py-24 text-center">
            <Activity className="mx-auto text-text-muted/20 mb-4" size={48} />
            <p className="text-text-muted font-bold uppercase tracking-wider text-[13px]">
              No pending finance requests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {budgets
              .sort((a, b) => {
                if (a.status === 'REQUESTED' && b.status !== 'REQUESTED') return -1;
                if (a.status !== 'REQUESTED' && b.status === 'REQUESTED') return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              })
              .map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    'bg-surface-card rounded-2xl shadow-sm border border-border-subtle hover:shadow-md hover:-translate-y-0.5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 group transition-all hover:border-primary-main/30 relative overflow-hidden',
                    b.status === 'DISBURSED' && 'opacity-60 grayscale-[0.3]',
                  )}
                >
                  {/* Swipe-to-action hint gradient for mobile */}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-indigo-50 to-transparent opacity-0 group-active:opacity-100 transition-opacity pointer-events-none md:hidden" />

                  <div className="flex gap-4 md:gap-6 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 font-bold text-lg shadow-sm shrink-0',
                        b.status === 'REQUESTED'
                          ? 'bg-warning/10 border-warning/20 text-warning'
                          : b.status === 'APPROVED'
                            ? 'bg-primary-main border-primary-main text-bg'
                            : 'bg-bg-secondary border-border-subtle text-text-muted',
                      )}
                    >
                      {b.profiles?.full_name?.charAt(0) || (
                        <User size={20} className="md:w-6 md:h-6" />
                      )}
                    </div>

                    <div className="space-y-1 md:space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <h3 className="text-sm md:text-xl font-bold text-text-main tracking-tight group-hover:text-primary-main transition-colors truncate">
                          {b.purpose}
                        </h3>
                        <div className="shrink-0">{statusBadge(b.status)}</div>
                      </div>

                      {/* Horizontal Scroller for mobile tags */}
                      <div className="flex overflow-x-auto no-scrollbar gap-2 pt-1 md:pt-0 text-[13px] font-bold uppercase tracking-wider text-text-muted pb-1">
                        <div className="shrink-0 flex items-center gap-1.5 bg-bg-secondary px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-border-subtle text-text-secondary">
                          <User size={10} className="text-primary-main/60 md:w-3 md:h-3" />{' '}
                          {b.profiles?.full_name || 'Staff Member'}
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 bg-bg-secondary px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-border-subtle text-text-secondary">
                          <ShieldCheck size={10} className="text-primary-main/60 md:w-3 md:h-3" />{' '}
                          {b.profiles?.role?.replace(/_/g, ' ') || 'Staff'}
                        </div>
                        <div className="shrink-0 flex items-center text-text-muted/40 font-mono">
                          ID: {b.id.substring(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8 shrink-0 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-border-subtle/30 md:border-t-0">
                    <div className="text-left md:text-right flex justify-between md:block items-end">
                      <div>
                        <p className="text-[13px] text-text-muted font-bold uppercase tracking-wider mb-0.5 md:mb-1">
                          {b.status === 'APPROVED' ? 'Approved' : 'Requested'}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-primary-main md:text-text-main tracking-tight">
                          {(b.amount_approved || b.amount_requested).toLocaleString()}
                          <span className="text-[13px] md:text-[11px] font-bold ml-1.5 uppercase opacity-80 md:text-primary-main">
                            ETB
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
                      {b.status === 'REQUESTED' &&
                        (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER') && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="col-span-1 px-6 md:px-8 h-12 rounded-xl text-[13px] md:text-[11px] font-bold uppercase tracking-wider shadow-md active:scale-95"
                            onClick={() => {
                              const amt = prompt(
                                'Approve Amount (ETB):',
                                b.amount_requested.toString(),
                              );
                              if (amt) approveBudget(b.id, Number(amt));
                            }}
                          >
                            Approve
                          </Button>
                        )}
                      {b.status === 'APPROVED' &&
                        (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="col-span-1 px-6 md:px-8 h-12 rounded-xl text-[13px] md:text-[11px] font-bold uppercase tracking-wider shadow-md bg-success hover:bg-success/80 text-bg active:scale-95"
                            onClick={() => {
                              if (window.confirm('Confirm disbursement of these funds?'))
                                disburseBudget(b.id);
                            }}
                          >
                            Mark Paid
                          </Button>
                        )}

                      <button
                        onClick={() => setSelectedBudget(b)}
                        className={cn(
                          'h-12 flex items-center justify-center rounded-xl bg-bg-secondary text-text-muted hover:text-primary-main hover:bg-primary-main/10 transition-all border border-border-subtle shadow-sm',
                          (b.status === 'REQUESTED' &&
                            (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER')) ||
                            (b.status === 'APPROVED' &&
                              (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR'))
                            ? 'col-span-1 w-full md:w-12'
                            : 'col-span-2 w-full md:w-12',
                        )}
                      >
                        <span className="md:hidden font-medium text-[13px] flex items-center gap-2">
                          Review <ArrowUpRight size={14} />
                        </span>
                        <ArrowUpRight size={20} className="hidden md:block" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="text-center md:text-left">
            <p className="text-[13px] font-bold text-text-muted uppercase tracking-wider mb-1">
              MTD Disbursement Volume
            </p>
            <p className="text-3xl font-bold text-text-main tracking-tight">
              {(totalPaidMtd / 1000).toFixed(1)}K{' '}
              <span className="text-[13px] text-primary-main font-bold ml-1.5 font-medium">
                Authorized
              </span>
            </p>
          </div>
          <div className="hidden md:block w-px h-12 bg-border-subtle" />
          <div className="text-center md:text-left">
            <p className="text-[13px] font-bold text-text-muted uppercase tracking-wider mb-1">
              Financial Integrity
            </p>
            <p className="text-3xl font-bold text-success tracking-tight">
              Verified{' '}
              <span className="text-[13px] text-text-muted font-bold ml-1.5 uppercase">Audit</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-text-muted/20">
          <ShieldCheck size={20} /> <Building2 size={20} /> <DollarSign size={20} />{' '}
          <Calculator size={20} />
        </div>
      </div>

      {/* Budget Detail Modal */}
      <Modal
        isOpen={!!selectedBudget}
        onClose={() => setSelectedBudget(null)}
        title="Finance Request Profile"
        subtitle={`Reference: ${selectedBudget?.id?.substring(0, 12).toUpperCase() || 'N/A'}`}
        maxWidth="max-w-2xl"
      >
        {selectedBudget && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-bg-secondary rounded-2xl border border-border-subtle">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-card rounded-xl shadow-sm border border-border-subtle flex items-center justify-center text-primary-main font-bold text-lg">
                  {selectedBudget.profiles?.full_name?.charAt(0) || <User size={24} />}
                </div>
                <div>
                  <p className="text-lg font-bold text-text-main tracking-tight">
                    {selectedBudget.purpose}
                  </p>
                  <p className="text-[13px] font-bold text-text-muted font-medium">
                    Requested by {selectedBudget.profiles?.full_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold text-text-muted font-medium mb-1">
                  Requested Sum
                </p>
                <p className="text-2xl font-bold text-text-main tracking-tight">
                  {selectedBudget.amount_requested.toLocaleString()}{' '}
                  <span className="text-[13px] text-primary-main font-mono">ETB</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border border-border-subtle bg-bg-secondary/30 space-y-1">
                <p className="text-[12px] font-bold text-text-muted font-medium">Current Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      selectedBudget.status === 'REQUESTED'
                        ? 'bg-warning'
                        : selectedBudget.status === 'APPROVED'
                          ? 'bg-primary-main'
                          : 'bg-success',
                    )}
                  />
                  <p className="text-sm font-bold text-text-main uppercase tracking-tight">
                    {selectedBudget.status}
                  </p>
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-border-subtle bg-bg-secondary/30 space-y-1">
                <p className="text-[12px] font-bold text-text-muted font-medium">Submission Date</p>
                <p className="text-sm font-bold text-text-main tracking-tight">
                  {new Date(selectedBudget.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-text-muted font-semibold">
                Audit Timeline
              </h4>
              <div className="space-y-0 pl-4 border-l-2 border-border-subtle ml-2">
                <div className="relative pl-6 pb-6">
                  <div className="absolute w-3 h-3 bg-primary-main rounded-full -left-[7px] top-1 shadow-md border-2 border-white" />
                  <p className="text-sm font-bold text-text-main leading-none">Request Logged</p>
                  <p className="text-[13px] text-text-muted font-medium mt-1">
                    Initiated by staff member in field registry
                  </p>
                </div>
                <div
                  className={cn(
                    'relative pl-6 pb-6',
                    selectedBudget.status === 'REQUESTED' && 'opacity-40',
                  )}
                >
                  <div
                    className={cn(
                      'absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-white',
                      selectedBudget.status === 'APPROVED' || selectedBudget.status === 'DISBURSED'
                        ? 'bg-primary-main'
                        : 'bg-border-subtle',
                    )}
                  />
                  <p className="text-sm font-bold text-text-main leading-none">
                    Managerial Authorization
                  </p>
                  <p className="text-[13px] text-text-muted font-medium mt-1">
                    {selectedBudget.status !== 'REQUESTED'
                      ? 'Budget approved and reserved'
                      : 'Awaiting senior review'}
                  </p>
                </div>
                <div
                  className={cn(
                    'relative pl-6',
                    selectedBudget.status !== 'DISBURSED' && 'opacity-40',
                  )}
                >
                  <div
                    className={cn(
                      'absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-bg',
                      selectedBudget.status === 'DISBURSED' ? 'bg-success' : 'bg-border-subtle',
                    )}
                  />
                  <p className="text-sm font-bold text-text-main leading-none">Funds Settlement</p>
                  <p className="text-[13px] text-text-muted font-medium mt-1">
                    {selectedBudget.status === 'DISBURSED'
                      ? 'Disbursement completed'
                      : 'Pending final payout'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedBudget(null)}>
                Close Profile
              </Button>
              {selectedBudget.status === 'REQUESTED' &&
                (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER') && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      const amt = prompt(
                        'Approve Amount (ETB):',
                        selectedBudget.amount_requested.toString(),
                      );
                      if (amt) {
                        approveBudget(selectedBudget.id, Number(amt));
                        setSelectedBudget(null);
                      }
                    }}
                  >
                    Approve Funds
                  </Button>
                )}
              {selectedBudget.status === 'APPROVED' &&
                (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
                  <Button
                    variant="primary"
                    className="bg-success hover:bg-success/80 text-bg"
                    onClick={() => {
                      if (window.confirm('Confirm disbursement?')) {
                        disburseBudget(selectedBudget.id);
                        setSelectedBudget(null);
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
    </div>
  );
}
