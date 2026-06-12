import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache, apiCache } from '../lib/cache';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Search, 
  Clock, 
  FileText,
  CreditCard,
  Banknote,
  AlertTriangle
} from 'lucide-react';
import { KpiTile } from '../components/ui/KpiTile';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../lib/utils';

export default function FinanceManager() {
  const { session } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [session]);

  const fetchPlans = () => {
    if (!session?.access_token) return;
    fetchWithCache('/finance-plans', {}, (data) => {
      setPlans(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  };

  const updateStatus = async (planId: string, status: string) => {
    if (!session?.access_token) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/finance-plans/${planId}/status`, { status });
      apiCache.clear();
      fetchPlans(); // Refresh
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlans = plans.filter(p => 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.vehicles?.make?.toLowerCase().includes(search.toLowerCase())
  );

  const totalApplications = plans.length;
  const approvedLoans = plans.filter(p => p.status === 'APPROVED').length;
  const rejectedLoans = plans.filter(p => p.status === 'REJECTED').length;
  const pendingLoans = plans.filter(p => p.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Finance Operations</h1>
          <p className="text-[13px] text-text-muted/80 font-medium mt-1">
            Review and adjudicate vehicle financing requests from Bank Partners.
          </p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-text-muted/60 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-4 h-12 bg-surface-card border border-border-subtle/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main/50 w-full md:w-72 transition-all text-[13px] font-medium text-text-main shadow-sm"
          />
        </div>
      </div>

      {/* KPIs */}
      <MobileKpis 
        totalApplications={totalApplications}
        approvedLoans={approvedLoans}
        rejectedLoans={rejectedLoans}
        pendingLoans={pendingLoans}
      />

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-16 bg-surface-card rounded-[20px] border border-border-subtle/30 shadow-sm">
          <FileText className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
          <p className="text-[15px] font-bold text-text-muted">No applications found</p>
          <p className="text-[13px] text-text-muted/60 mt-1">There are currently no finance applications matching your criteria.</p>
        </div>
      ) : (
        <>
          <DesktopTable plans={filteredPlans} onUpdateStatus={updateStatus} />
          <MobileGrid plans={filteredPlans} onUpdateStatus={updateStatus} />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  if (status === 'APPROVED') return 'bg-success/10 text-success border-success/20';
  if (status === 'REJECTED') return 'bg-error-main/10 text-error-main border-error-main/20';
  return 'bg-warning/10 text-warning border-warning/20';
}

const MobileKpis = ({ totalApplications, approvedLoans, rejectedLoans, pendingLoans }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
    <KpiTile
      label="Total Applications"
      value={totalApplications}
      icon={<FileText size={14} />}
      className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28"
    />
    <KpiTile
      label="Pending Review"
      value={pendingLoans}
      icon={<Clock size={14} />}
      className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28"
    />
    <KpiTile
      label="Approved Loans"
      value={approvedLoans}
      icon={<CheckCircle size={14} />}
      className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28"
    />
    <KpiTile
      label="Rejected Loans"
      value={rejectedLoans}
      icon={<XCircle size={14} />}
      className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28"
    />
  </div>
);

const DesktopTable = ({ plans, onUpdateStatus }: { plans: any[], onUpdateStatus: (id: string, status: string) => void }) => (
  <div className="bg-surface-card rounded-[24px] shadow-sm border border-border-subtle/30 p-2 hidden md:block">
    <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
      <h2 className="text-[14px] font-black text-text-main">Credit Adjudication Ledger</h2>
      <p className="text-[12px] text-text-muted/60 font-medium">
        Official documentation of credit reviews and loan processing
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-text-muted font-medium text-[12px] uppercase tracking-wider">
            <th className="pb-4 pt-6 px-4">Applicant Profile</th>
            <th className="pb-4 pt-6 px-4">Asset Requested</th>
            <th className="pb-4 pt-6 px-4">Financial Structure</th>
            <th className="pb-4 pt-6 px-4 text-center">Status</th>
            <th className="pb-4 pt-6 px-4 text-right">Adjudication</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="group transition-all">
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-primary-main/10 flex items-center justify-center border border-primary-main/10 shrink-0">
                    <Building2 size={16} className="text-primary-main" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-main font-bold text-[14px] tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                      {plan.profiles?.full_name || 'Unknown Applicant'}
                    </p>
                    <p className="text-[11px] text-text-muted font-mono bg-bg-secondary px-2 py-0.5 rounded-md w-fit border border-border-subtle/30">
                      {plan.profiles?.phone_number || plan.profiles?.phone || 'No Phone'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="space-y-1">
                  <p className="text-text-main font-bold text-[13px] tracking-tight leading-tight">
                    {plan.vehicles?.make} {plan.vehicles?.model}
                  </p>
                  <p className="text-[11px] text-text-muted/80 font-medium flex items-center gap-1.5">
                    <Banknote size={10} /> {(plan.vehicles?.retail_price_etb / 1000000).toFixed(2)}M ETB Retail
                  </p>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-primary-main tracking-tight">
                      {(plan.total_price_etb / 1000000).toFixed(2)}M ETB
                    </span>
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Loan</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted/80 font-medium">
                    <CreditCard size={12} className="text-primary-main/50" />
                    {(plan.monthly_installment_etb / 1000).toFixed(1)}K / month
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all text-center">
                <Badge variant="default" className={cn("text-[11px] uppercase tracking-wider font-bold border shadow-sm", getStatusStyle(plan.status))}>
                  {plan.status}
                </Badge>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center justify-end gap-2">
                  {plan.status === 'SUBMITTED' ? (
                    <>
                      <Tooltip content="Approve Application">
                        <button
                          onClick={() => onUpdateStatus(plan.id, 'APPROVED')}
                          disabled={plan._submitting}
                          className="w-10 h-10 flex items-center justify-center bg-success/10 text-success rounded-[12px] hover:bg-success hover:text-white border border-success/20 shadow-sm transition-all active:scale-90 disabled:opacity-50"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Reject Application">
                        <button
                          onClick={() => onUpdateStatus(plan.id, 'REJECTED')}
                          disabled={plan._submitting}
                          className="w-10 h-10 flex items-center justify-center bg-error-main/10 text-error-main rounded-[12px] hover:bg-error-main hover:text-white border border-error-main/20 shadow-sm transition-all active:scale-90 disabled:opacity-50"
                        >
                          <XCircle size={16} />
                        </button>
                      </Tooltip>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-bg-secondary rounded-[10px] border border-border-subtle/30 text-[11px] font-bold text-text-muted/60">
                      <CheckCircle size={12} /> Resolved
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MobileGrid = ({ plans, onUpdateStatus }: { plans: any[], onUpdateStatus: (id: string, status: string) => void }) => (
  <div className="flex flex-col gap-4 md:hidden">
    <div className="flex items-center justify-between px-1">
      <p className="text-[15px] font-black text-text-main">Adjudication Queue</p>
      <span className="text-[12px] font-bold text-text-muted bg-bg-secondary px-2 py-1 rounded-md">{plans.length} Records</span>
    </div>
    
    <div className="flex flex-col gap-3">
      {plans.map((plan) => (
        <div key={plan.id} className="bg-surface-card rounded-[20px] border border-border-subtle/30 shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-5 flex items-start justify-between border-b border-border-subtle/30 bg-bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-primary-main/10 flex items-center justify-center border border-primary-main/10 shrink-0 shadow-inner">
                <Building2 size={20} className="text-primary-main" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-main leading-tight tracking-tight">
                  {plan.profiles?.full_name || 'Unknown Applicant'}
                </h3>
                <p className="text-[11px] text-text-muted font-mono mt-1">
                  {plan.profiles?.phone_number || plan.profiles?.phone || 'No Contact'}
                </p>
              </div>
            </div>
            <Badge variant="default" className={cn("text-[10px] uppercase font-bold border", getStatusStyle(plan.status))}>
              {plan.status}
            </Badge>
          </div>

          {/* Body */}
          <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-2 bg-surface-card flex-1">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Asset Target</p>
              <p className="text-[13px] font-bold text-text-main tracking-tight truncate">
                {plan.vehicles?.make} {plan.vehicles?.model}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Bank Partner</p>
              <p className="text-[13px] font-bold text-text-main tracking-tight truncate">
                {plan.bank_partners?.name || 'Standard Plan'}
              </p>
            </div>
            <div className="col-span-2 h-px bg-border-subtle/30 my-1" />
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Total Financed</p>
              <p className="text-[14px] font-black text-primary-main tracking-tight">
                {(plan.total_price_etb / 1000000).toFixed(2)}M <span className="text-[10px] font-bold text-text-muted">ETB</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Monthly Cost</p>
              <p className="text-[14px] font-black text-text-main tracking-tight">
                {(plan.monthly_installment_etb / 1000).toFixed(1)}K <span className="text-[10px] font-bold text-text-muted">ETB</span>
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border-subtle/30 bg-bg-base flex items-center justify-end gap-2">
            {plan.status === 'SUBMITTED' ? (
              <>
                <button
                  onClick={() => onUpdateStatus(plan.id, 'REJECTED')}
                  disabled={plan._submitting}
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-surface-card border border-error-main/30 text-error-main rounded-[12px] font-bold text-[13px] hover:bg-error-main/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  <XCircle size={16} /> Deny
                </button>
                <button
                  onClick={() => onUpdateStatus(plan.id, 'APPROVED')}
                  disabled={plan._submitting}
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-success text-white rounded-[12px] font-bold text-[13px] hover:bg-success/90 shadow-md shadow-success/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Authorize
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 h-11 bg-surface-card border border-border-subtle/30 rounded-[12px] text-[12px] font-bold text-text-muted">
                <CheckCircle size={14} className="text-text-muted/60" /> Adjudication Complete
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);
