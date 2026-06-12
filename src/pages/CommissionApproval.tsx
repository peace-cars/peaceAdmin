import React, { useState, useEffect } from 'react';
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
  Wallet,
  Building2,
  Phone
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';

export default function CommissionApproval() {
  const { session } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    try {
      await api.patch(`/commission-workflow/${id}/dm-verify`, {});
      setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, dmVerified: true } : c)));
    } catch (e) {
      console.error('[Commissions] Verification Failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const gmApprove = async (id: string) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/commission-workflow/${id}/gm-approve`, {});
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, gmApproved: true, isPaid: true } : c)),
      );
    } catch (e) {
      console.error('[Commissions] Approval Failed', e);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Financial Clearing</h1>
          <p className="text-[13px] text-text-muted/80 font-medium mt-1">
            Management authorization stream for partner incentives and payouts.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <MobileKpis
        pendingPayoutTotal={pendingPayoutTotal}
        settledMtdTotal={settledMtdTotal}
        activePartnersCount={activePartnersCount}
        slaCompliance={slaCompliance}
      />

      {/* Main Content */}
      <DesktopTable 
        commissions={commissions} 
        role={role}
        onSelect={setSelectedCommission}
        onVerify={dmVerify}
        onApprove={gmApprove}
        isSubmitting={isSubmitting}
      />
      <MobileGrid 
        commissions={commissions}
        role={role}
        onSelect={setSelectedCommission}
        onVerify={dmVerify}
        onApprove={gmApprove}
        isSubmitting={isSubmitting}
      />

      {/* Commission Detail Modal */}
      <CommissionModal 
        isOpen={!!selectedCommission} 
        onClose={() => setSelectedCommission(null)} 
        commission={selectedCommission} 
        role={role}
        onVerify={() => { dmVerify(selectedCommission?.id); setSelectedCommission(null); }}
        onApprove={() => { gmApprove(selectedCommission?.id); setSelectedCommission(null); }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge = ({ c }: { c: any }) => {
  if (c.isPaid) return <Badge variant="success" className="text-[10px] uppercase font-bold border shadow-sm">Settled</Badge>;
  if (c.gmApproved) return <Badge variant="primary" className="text-[10px] uppercase font-bold border shadow-sm">Processing</Badge>;
  if (c.dmVerified) return <Badge variant="warning" className="text-[10px] uppercase font-bold border shadow-sm">Verified</Badge>;
  return <Badge variant="default" className="text-[10px] uppercase font-bold border shadow-sm bg-bg-secondary text-text-muted">Review</Badge>;
};

const MobileKpis = ({ pendingPayoutTotal, settledMtdTotal, activePartnersCount, slaCompliance }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
    <Tooltip content="Total incentive volume pending verification">
      <KpiTile label="Pending Payout" value={`${(pendingPayoutTotal / 1000).toFixed(1)}K`} icon={<Clock size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    </Tooltip>
    <Tooltip content="Total disbursements completed this month">
      <KpiTile label="Settled (MTD)" value={`${(settledMtdTotal / 1000).toFixed(1)}K`} icon={<FileCheck2 size={14} />} color="emerald" className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    </Tooltip>
    <Tooltip content="Total network partners currently in registry">
      <KpiTile label="Active Partners" value={activePartnersCount} icon={<Users size={14} />} color="indigo" className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    </Tooltip>
    <Tooltip content="Percentage of payouts settled within SLA registry">
      <KpiTile label="SLA Compliance" value={slaCompliance} icon={<Star size={14} />} color="indigo" className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    </Tooltip>
  </div>
);

const DesktopTable = ({ commissions, role, onSelect, onVerify, onApprove, isSubmitting }: any) => {
  if (commissions.length === 0) {
    return (
      <div className="hidden md:flex py-24 text-center rounded-2xl border border-dashed border-border-subtle bg-surface-card flex-col items-center justify-center gap-4">
        <Lock className="text-text-muted opacity-10" size={48} />
        <p className="text-text-muted/60 font-medium text-[13px]">
          No active incentives in registry.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-card rounded-[24px] shadow-sm border border-border-subtle/30 p-2 hidden md:block">
      <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
        <h2 className="text-[14px] font-black text-text-main">Authorization Pipeline</h2>
        <p className="text-[12px] text-text-muted/60 font-medium">Management authorization stream for partner incentives</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2 px-4">
          <thead>
            <tr className="text-text-muted font-medium text-[12px] uppercase tracking-wider">
              <th className="pb-4 pt-6 px-4">Beneficiary</th>
              <th className="pb-4 pt-6 px-4">Type</th>
              <th className="pb-4 pt-6 px-4">Amount (ETB)</th>
              <th className="pb-4 pt-6 px-4 text-center">Status</th>
              <th className="pb-4 pt-6 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c: any) => (
              <tr key={c.id} className={cn("group transition-all", c.isPaid && 'opacity-60 grayscale-[0.3]')}>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-inner", c.isPaid ? 'bg-bg-base border border-border-subtle text-text-muted/60' : c.dmVerified ? 'bg-warning/10 border border-warning/20 text-warning' : 'bg-primary-main/10 border border-primary-main/20 text-primary-main')}>
                      <Users size={16} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-text-main font-bold text-[14px] tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                        {c.beneficiaryName || 'Operational Partner'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-text-muted font-mono bg-bg-secondary px-2 py-0.5 rounded-md w-fit border border-border-subtle/30 uppercase">
                          ID: {c.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="space-y-1">
                    <Badge variant={c.type === 'BROKER_REFERRAL' ? 'primary' : 'default'} className="text-[10px] uppercase font-bold border shadow-sm">
                      {c.type === 'BROKER_REFERRAL' ? 'External Partner' : 'Performance Tier'}
                    </Badge>
                    <p className="text-[11px] text-text-muted/80 font-medium flex items-center gap-1.5 mt-1">
                      <Activity size={10} /> {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <p className="text-lg font-black text-text-main font-mono tracking-tight">{Number(c.amountEtb).toLocaleString()}</p>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all text-center">
                  <StatusBadge c={c} />
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center justify-end gap-2">
                    {!c.dmVerified && role === 'DISTRICT_MANAGER' && (
                      <Button variant="primary" className="bg-warning text-bg hover:bg-warning/90 h-9 px-4 shadow-sm rounded-xl text-[11px] font-bold" onClick={() => onVerify(c.id)} disabled={isSubmitting} loading={isSubmitting}>Verify</Button>
                    )}
                    {c.dmVerified && !c.gmApproved && (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
                      <Button variant="primary" className="h-9 px-4 shadow-xl rounded-xl text-[11px] font-bold bg-text-main text-bg" onClick={() => onApprove(c.id)} disabled={isSubmitting} loading={isSubmitting}>Settle</Button>
                    )}
                    <Tooltip content="View Details">
                      <button onClick={() => onSelect(c)} className="w-9 h-9 flex items-center justify-center bg-bg-base border border-border-subtle/30 rounded-xl text-text-muted hover:text-text-main transition-colors active:scale-95 shadow-sm">
                        <ArrowUpRight size={14} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MobileGrid = ({ commissions, role, onSelect, onVerify, onApprove, isSubmitting }: any) => {
  if (commissions.length === 0) {
    return (
      <div className="md:hidden py-16 text-center rounded-[20px] border border-dashed border-border-subtle bg-surface-card flex flex-col items-center justify-center gap-4">
        <Lock className="text-text-muted opacity-10" size={40} />
        <p className="text-text-muted/60 font-medium text-[13px]">
          No active incentives in registry.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      <div className="flex items-center justify-between px-1">
        <p className="text-[15px] font-black text-text-main">Authorization Queue</p>
        <span className="text-[12px] font-bold text-text-muted bg-bg-secondary px-2 py-1 rounded-md">{commissions.length} Requests</span>
      </div>
      <div className="flex flex-col gap-4">
        {commissions.map((c: any) => (
          <div key={c.id} className={cn("bg-surface-card rounded-[20px] border shadow-sm transition-all overflow-hidden flex flex-col", c.isPaid ? "border-border-subtle/30 opacity-70 grayscale-[0.3]" : "border-border-subtle/30")}>
            {/* Header */}
            <div className="p-5 flex items-start justify-between border-b border-border-subtle/30 bg-bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-inner", c.isPaid ? 'bg-bg-base border border-border-subtle text-text-muted/60' : c.dmVerified ? 'bg-warning/10 border border-warning/20 text-warning' : 'bg-primary-main/10 border border-primary-main/20 text-primary-main')}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-text-main leading-tight tracking-tight">
                    {c.beneficiaryName || 'Operational Partner'}
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono mt-1 uppercase">ID: {c.id.substring(0, 8)}</p>
                </div>
              </div>
              <StatusBadge c={c} />
            </div>

            {/* Details */}
            <div className="p-4 grid grid-cols-2 gap-4 bg-surface-card">
              <div className="col-span-2 flex justify-between items-center bg-bg-secondary/50 rounded-xl p-3 border border-border-subtle/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Authorization Sum</span>
                <div className="flex items-center gap-1.5 text-[16px] font-black font-mono text-text-main tracking-tight">
                  {Number(c.amountEtb).toLocaleString()} <span className="text-[10px] text-primary-main font-bold">ETB</span>
                </div>
              </div>
              <div className="border border-border-subtle/30 rounded-xl p-3 bg-bg-secondary/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Type</p>
                <Badge variant={c.type === 'BROKER_REFERRAL' ? 'primary' : 'default'} className="text-[10px] uppercase font-bold border shadow-sm">
                  {c.type === 'BROKER_REFERRAL' ? 'Partner' : 'Tier'}
                </Badge>
              </div>
              <div className="border border-border-subtle/30 rounded-xl p-3 bg-bg-secondary/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Date</p>
                <p className="text-[12px] font-bold text-text-main">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border-subtle/30 bg-bg-base flex items-center justify-end gap-2">
              <button onClick={() => onSelect(c)} className="flex-1 flex justify-center items-center gap-2 h-11 bg-surface-card border border-border-subtle/30 rounded-[12px] text-text-main font-bold text-[12px] hover:bg-bg-secondary shadow-sm">
                <ArrowUpRight size={14} /> Details
              </button>
              {!c.dmVerified && role === 'DISTRICT_MANAGER' && (
                <button onClick={() => onVerify(c.id)} disabled={isSubmitting} className="flex-1 flex items-center justify-center h-11 border rounded-[12px] shadow-sm bg-warning text-bg hover:bg-warning/90 font-bold text-[12px] disabled:opacity-50">
                  Verify
                </button>
              )}
              {c.dmVerified && !c.gmApproved && (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
                <button onClick={() => onApprove(c.id)} disabled={isSubmitting} className="flex-1 flex items-center justify-center h-11 border rounded-[12px] shadow-sm bg-text-main text-bg font-bold text-[12px] disabled:opacity-50">
                  Settle
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modals
const CommissionModal = ({ isOpen, onClose, commission, role, onVerify, onApprove }: any) => {
  if (!commission) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Commission Distribution Profile" subtitle={`Reference: ${commission.id?.substring(0, 12).toUpperCase() || 'N/A'}`} maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 bg-bg-secondary rounded-2xl border border-border-subtle/30 gap-4">
          <div className="w-16 h-16 bg-surface-card rounded-[16px] shadow-sm border border-border-subtle/30 flex items-center justify-center text-primary-main">
            <Users size={32} />
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-text-main tracking-tight leading-none mb-1">
              {commission.beneficiaryName}
            </p>
            <p className="text-[12px] font-bold text-text-muted/80 uppercase">
              {commission.beneficiaryRole?.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="text-center mt-2 pt-4 border-t border-border-subtle/30 w-full">
            <p className="text-[11px] font-bold text-text-muted/60 uppercase tracking-wider mb-1">Approved Payout</p>
            <p className="text-3xl font-black text-text-main tracking-tight font-mono">
              {Number(commission.amountEtb).toLocaleString()} <span className="text-[14px] text-primary-main">ETB</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 bg-surface-card p-5 rounded-2xl border border-border-subtle/30">
          <h4 className="text-[11px] font-bold text-text-main uppercase tracking-wider mb-2">
            Approval Timeline
          </h4>
          <div className="space-y-0 pl-4 border-l-2 border-border-subtle/30 ml-2">
            <div className="relative pl-6 pb-6">
              <div className="absolute w-3 h-3 bg-primary-main rounded-full -left-[7px] top-1 shadow-md border-2 border-surface-card" />
              <p className="text-sm font-bold text-text-main leading-none">Commission Logged</p>
              <p className="text-[12px] font-mono text-text-muted/60 mt-1">
                {new Date(commission.createdAt).toLocaleString()}
              </p>
            </div>
            <div className={cn('relative pl-6 pb-6', !commission.dmVerified && 'opacity-40')}>
              <div className={cn('absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-surface-card', commission.dmVerified ? 'bg-warning' : 'bg-border-subtle/50')} />
              <p className="text-sm font-bold text-text-main leading-none">
                District Manager Verification
              </p>
              <p className="text-[12px] font-mono text-text-muted/60 mt-1">
                {commission.dmVerified ? 'Verified locally' : 'Pending DM Review'}
              </p>
            </div>
            <div className={cn('relative pl-6', !commission.gmApproved && !commission.isPaid && 'opacity-40')}>
              <div className={cn('absolute w-3 h-3 rounded-full -left-[7px] top-1 shadow-md border-2 border-surface-card', commission.isPaid ? 'bg-success' : 'bg-border-subtle/50')} />
              <p className="text-sm font-bold text-text-main leading-none">
                Final Audit & Settlement
              </p>
              <p className="text-[12px] font-mono text-text-muted/60 mt-1">
                {commission.isPaid ? 'Funds Disbursed' : 'Pending Finance Approval'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 h-12 rounded-xl border-border-subtle/30 shadow-sm" onClick={onClose}>Close Profile</Button>
          {!commission.dmVerified && role === 'DISTRICT_MANAGER' && (
            <Button variant="primary" className="flex-1 h-12 rounded-xl bg-warning text-bg shadow-xl active:scale-95 transition-all" onClick={onVerify}>
              Verify Payout
            </Button>
          )}
          {commission.dmVerified && !commission.gmApproved && (role === 'GENERAL_MANAGER' || role === 'FINANCE_AUDITOR') && (
            <Button variant="primary" className="flex-1 h-12 rounded-xl bg-text-main text-bg shadow-xl active:scale-95 transition-all" onClick={onApprove}>
              Settle Incentive
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
