import { useState, useEffect } from 'react';
import {
  Check,
  Clock,
  DollarSign,
  ShieldCheck,
  ArrowUpRight,
  Users,
  Activity,
  Star,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../lib/utils';

import { Modal } from '../components/ui/Modal';

export default function CommissionApproval() {
  const { session } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const role = localStorage.getItem('admin_role');

  const fetchCommissions = async () => {
    try {
      const data = await api.get<any[]>('/commission-workflow');
      setCommissions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Commissions] Fetch Failed', e);
    }
  };

  useEffect(() => {
    if (session) fetchCommissions();
  }, [session]);

  const dmVerify = async (id: string) => {
    try {
      await api.patch(`/commission-workflow/${id}/dm-verify`, {});
      setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, dmVerified: true } : c)));
    } catch (e) {
      console.error('[Commissions] Verification Failed', e);
    }
  };

  const gmApprove = async (id: string) => {
    try {
      await api.patch(`/commission-workflow/${id}/gm-approve`, {});
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, gmApproved: true, isPaid: true } : c)),
      );
    } catch (e) {
      console.error('[Commissions] Approval Failed', e);
    }
  };

  const renderStatusBadge = (c: any) => {
    if (c.isPaid) return <Badge variant="success">Settled</Badge>;
    if (c.gmApproved) return <Badge variant="primary">Processing</Badge>;
    if (c.dmVerified) return <Badge variant="warning">Verified</Badge>;
    return <Badge variant="default">Review</Badge>;
  };

  const pendingPayoutTotal = commissions
    .filter((c) => !c.isPaid)
    .reduce((s, c) => s + Number(c.amountEtb), 0);
  const settledMtdTotal = commissions
    .filter((c) => c.isPaid && new Date(c.createdAt).getMonth() === new Date().getMonth())
    .reduce((s, c) => s + Number(c.amountEtb), 0);
  const activePartnersCount = new Set(commissions.map((c) => c.beneficiaryName)).size;
  const slaCompliance = commissions.length > 0 ? '100%' : 'N/A';

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Tooltip content="Total incentive volume pending verification">
          <KpiTile
            label="Pending Payout"
            value={`${(pendingPayoutTotal / 1000).toFixed(1)}K ETB`}
            icon={<Clock size={14} />}
            className="p-6 h-32"
          />
        </Tooltip>
        <Tooltip content="Total disbursements completed this month">
          <KpiTile
            label="Settled (MTD)"
            value={`${(settledMtdTotal / 1000).toFixed(1)}K ETB`}
            icon={<FileCheck2 size={14} />}
            className="p-6 h-32"
            color="emerald"
          />
        </Tooltip>
        <Tooltip content="Total network partners currently in registry">
          <KpiTile
            label="Active Partners"
            value={`${activePartnersCount} Units`}
            icon={<Users size={14} />}
            className="p-6 h-32"
            color="indigo"
          />
        </Tooltip>
        <Tooltip content="Percentage of payouts settled within SLA registry">
          <KpiTile
            label="SLA Compliance"
            value={slaCompliance}
            icon={<Star size={14} />}
            className="p-6 h-32"
            color="indigo"
          />
        </Tooltip>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-1.5 px-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-text-main font-semibold">
              Payout Authorization Pipeline
            </h2>
            <div className="flex-grow mx-6 h-px bg-border-subtle/30" />
          </div>
          <p className="text-[12px] text-text-muted/60 font-medium">
            Management authorization stream for partner incentives
          </p>
        </div>

        {commissions.length === 0 ? (
          <div className="py-24 text-center rounded-2xl border border-dashed border-border-subtle bg-surface-card flex flex-col items-center justify-center gap-4">
            <Lock className="text-text-muted opacity-10" size={48} />
            <p className="text-text-muted/60 font-medium text-[13px]">
              No active incentives in registry.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {commissions.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'bg-surface-card rounded-2xl shadow-sm border border-border-subtle/50 hover:shadow-md hover:-translate-y-0.5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 group transition-all hover:border-primary-main/30 relative overflow-hidden',
                  c.isPaid &&
                    'opacity-60 bg-bg-secondary/50 grayscale shadow-none border-dashed pointer-events-none',
                )}
              >
                {/* Swipe-to-action hint gradient for mobile */}
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-indigo-50 to-transparent opacity-0 group-active:opacity-100 transition-opacity pointer-events-none md:hidden" />

                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 hidden md:block">
                  <Badge variant="primary" className="shadow-lg">
                    Authorize Settlement
                  </Badge>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <div
                    className={cn(
                      'w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all shrink-0 shadow-inner',
                      c.isPaid
                        ? 'bg-bg-secondary border-border-subtle/30 text-text-muted/30'
                        : c.dmVerified
                          ? 'bg-warning/10 border-warning/20 text-warning'
                          : 'bg-primary-main/10 border-primary-main/20 text-primary-main',
                    )}
                  >
                    <Users size={20} className="md:w-6 md:h-6" />
                  </div>

                  <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <h3 className="text-sm md:text-base font-bold text-text-main tracking-tight leading-tight group-hover:text-primary-main transition-colors truncate">
                        {c.beneficiaryName || 'Operational Partner'}
                      </h3>
                      <div className="shrink-0">
                        <Tooltip content="Current Authorization Status">
                          {renderStatusBadge(c)}
                        </Tooltip>
                      </div>
                    </div>

                    {/* Horizontal Scroller for mobile tags */}
                    <div className="flex overflow-x-auto no-scrollbar gap-2 pt-1 md:pt-0 text-[13px] font-medium text-text-muted opacity-80 pb-1">
                      <div className="shrink-0 flex items-center">
                        <Badge variant={c.type === 'BROKER_REFERRAL' ? 'primary' : 'default'}>
                          {c.type === 'BROKER_REFERRAL' ? 'External Partner' : 'Performance Tier'}
                        </Badge>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <span className="flex items-center gap-1.5 font-mono bg-bg-secondary px-2 py-1 rounded-md border border-border-subtle/30 text-text-muted/60">
                          <Activity size={10} /> {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <Badge
                          variant="default"
                          className="font-mono bg-bg-secondary border-border-subtle/30 text-text-muted/40"
                        >
                          ID: {c.id.substring(0, 8).toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-10 md:border-l border-border-subtle/30 md:pl-10 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-border-subtle/30 md:border-t-0">
                  <div className="text-left md:text-right shrink-0 flex justify-between md:block items-end">
                    <div>
                      <p className="text-[13px] text-text-muted font-medium mb-0.5 md:mb-1.5">
                        Authorization Sum
                      </p>
                      <p className="text-2xl font-bold text-primary-main md:text-text-main tracking-tight leading-none">
                        {Number(c.amountEtb).toLocaleString()}
                        <span className="text-[13px] md:text-[11px] font-bold ml-1.5 uppercase opacity-80">
                          ETB
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
                    {!c.dmVerified && role === 'DISTRICT_MANAGER' && (
                      <Button
                        variant="primary"
                        className="col-span-1 bg-warning text-bg hover:bg-warning/90 h-12 md:h-11 px-6 shadow-md rounded-xl text-[13px] md:text-[11px] font-bold"
                        onClick={() => dmVerify(c.id)}
                      >
                        Verify
                      </Button>
                    )}
                    {c.dmVerified &&
                      !c.gmApproved &&
                      (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
                        <Button
                          variant="primary"
                          className="col-span-1 h-12 md:h-11 px-6 shadow-xl rounded-xl text-[13px] md:text-[11px] font-bold bg-text-main text-bg"
                          onClick={() => gmApprove(c.id)}
                        >
                          Settle
                        </Button>
                      )}

                    <button
                      onClick={() => setSelectedCommission(c)}
                      className={cn(
                        'h-12 md:h-11 flex items-center justify-center rounded-xl bg-bg-secondary border border-border-subtle/30 text-text-muted hover:text-primary-main hover:bg-surface-card transition-all shadow-sm active:scale-95',
                        (!c.dmVerified && role === 'DISTRICT_MANAGER') ||
                          (c.dmVerified &&
                            !c.gmApproved &&
                            (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR'))
                          ? 'col-span-1 w-full md:w-11'
                          : 'col-span-2 w-full md:w-11',
                      )}
                    >
                      <span className="md:hidden font-medium text-[13px] flex items-center gap-2">
                        Details <ArrowUpRight size={14} />
                      </span>
                      <ArrowUpRight size={18} className="hidden md:block" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface-card border border-border-subtle/30 p-10 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="flex items-center gap-16 relative z-10">
          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-tight">
              Total Ledger Disbursements
            </p>
            <p className="text-2xl font-bold text-text-main tracking-tight leading-none">
              {(settledMtdTotal / 1000).toFixed(1)}K{' '}
              <span className="text-[11px] text-primary-main font-bold ml-1.5">ETB</span>
            </p>
          </div>
          <div className="w-px h-12 bg-border-subtle/30" />
          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-tight">
              Verification Protocol
            </p>
            <p className="text-2xl font-bold text-text-main tracking-tight leading-none">
              Verified{' '}
              <span className="text-[11px] text-success font-bold ml-2 font-medium">Active</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-primary-main/5 opacity-40 group-hover:opacity-100 transition-all">
          <ShieldCheck size={32} />
          <Users size={32} />
          <DollarSign size={32} />
          <Star size={32} />
        </div>
      </div>

      {/* Commission Detail Modal */}
      <Modal
        isOpen={!!selectedCommission}
        onClose={() => setSelectedCommission(null)}
        title="Commission Distribution Profile"
        subtitle={`Reference: ${selectedCommission?.id?.substring(0, 12).toUpperCase() || 'N/A'}`}
        maxWidth="max-w-2xl"
      >
        {selectedCommission && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-bg-secondary rounded-2xl border border-border-subtle/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-card rounded-xl shadow-sm border border-border-subtle/30 flex items-center justify-center text-primary-main">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold text-text-main tracking-tight">
                    {selectedCommission.beneficiaryName}
                  </p>
                  <p className="text-[13px] font-bold text-text-muted/60">
                    {selectedCommission.beneficiaryRole?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold text-text-muted/40 mb-1">Approved Payout</p>
                <p className="text-2xl font-bold text-text-main tracking-tight">
                  {Number(selectedCommission.amountEtb).toLocaleString()}{' '}
                  <span className="text-[13px] text-primary-main font-mono">ETB</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-text-muted/40 uppercase tracking-wider">
                Approval Timeline
              </h4>
              <div className="space-y-0 pl-4 border-l-2 border-border-subtle/30 ml-2">
                <div className="relative pl-6 pb-6">
                  <div className="absolute w-3 h-3 bg-primary-main rounded-full -left-[7px] top-1 shadow-md border-2 border-surface-card" />
                  <p className="text-sm font-bold text-text-main leading-none">Commission Logged</p>
                  <p className="text-[13px] text-text-muted/60 mt-1">
                    {new Date(selectedCommission.createdAt).toLocaleString()}
                  </p>
                </div>
                <div
                  className={cn(
                    'relative pl-6 pb-6',
                    !selectedCommission.dmVerified && 'opacity-40',
                  )}
                >
                  <div
                    className={cn(
                      'absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-surface-card',
                      selectedCommission.dmVerified ? 'bg-warning' : 'bg-border-subtle/50',
                    )}
                  />
                  <p className="text-sm font-bold text-text-main leading-none">
                    District Manager Verification
                  </p>
                  <p className="text-[13px] text-text-muted/60 mt-1">
                    {selectedCommission.dmVerified ? 'Verified locally' : 'Pending DM Review'}
                  </p>
                </div>
                <div
                  className={cn(
                    'relative pl-6',
                    !selectedCommission.gmApproved && !selectedCommission.isPaid && 'opacity-40',
                  )}
                >
                  <div
                    className={cn(
                      'absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-surface-card',
                      selectedCommission.isPaid ? 'bg-success' : 'bg-border-subtle/50',
                    )}
                  />
                  <p className="text-sm font-bold text-text-main leading-none">
                    Final Audit & Settlement
                  </p>
                  <p className="text-[13px] text-text-muted/60 mt-1">
                    {selectedCommission.isPaid ? 'Funds Disbursed' : 'Pending Finance Approval'}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-border-subtle/30 flex justify-end gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-xl text-[13px] font-bold"
                onClick={() => setSelectedCommission(null)}
              >
                Close Profile
              </Button>
              {!selectedCommission.dmVerified && role === 'DISTRICT_MANAGER' && (
                <Button
                  variant="primary"
                  className="h-11 rounded-xl text-[13px] font-bold bg-warning text-bg"
                  onClick={() => {
                    dmVerify(selectedCommission.id);
                    setSelectedCommission(null);
                  }}
                >
                  Verify Payout
                </Button>
              )}
              {selectedCommission.dmVerified &&
                !selectedCommission.gmApproved &&
                (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
                  <Button
                    variant="primary"
                    className="h-11 rounded-xl text-[13px] font-bold bg-text-main text-bg"
                    onClick={() => {
                      gmApprove(selectedCommission.id);
                      setSelectedCommission(null);
                    }}
                  >
                    Settle Incentive
                  </Button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
