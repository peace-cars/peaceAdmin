import { useState, useEffect } from "react";
import { 
  Activity, TrendingUp, Users, Package, 
  MapPin, CheckCircle2, AlertTriangle, Clock, 
  CarFront, DollarSign, ChevronRight, ChevronDown, User,
  Building2, LineChart, Trophy, ClipboardCheck,
  ShieldCheck, Zap, X
} from 'lucide-react';
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { fetchWithCache } from "../lib/cache";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Tooltip } from "../components/ui/Tooltip";
import { cn } from "../lib/utils";
import { SkeletonKpi } from "../components/ui/Skeleton";

// Dashboard Sub-components
import { GeneralManagerView } from "../components/dashboard/GeneralManagerView";
import { DistrictManagerView } from "../components/dashboard/DistrictManagerView";
import { FinanceAuditorView } from "../components/dashboard/FinanceAuditorView";
import { StaffView } from "../components/dashboard/StaffView";
import { DetailedInspectionModal } from "../components/dashboard/DetailedInspectionModal";
import { LogViewerModal } from "../components/dashboard/LogViewerModal";
import { InspectionReportView } from "../components/dashboard/InspectionReportView";

type RoleType = "USER" | "BROKER" | "STAFF" | "DISTRICT_MANAGER" | "GENERAL_MANAGER" | "FINANCE_AUDITOR";

export default function Dashboard() {
  const { session } = useAuth();
  // Always derive role from the JWT-backed session profile — never trust localStorage alone.
  // localStorage('admin_role') may be stale, missing, or from a previous login.
  const role = (
    session?.profile?.role ||
    (localStorage.getItem('admin_role') as RoleType)
  ) ?? null;
  const LOCATION_NAME = localStorage.getItem('admin_location') || "Central Registry Hub";
  const ADMIN_NAME = session?.profile?.full_name || "Administrator";

  // Global Dashboard State
  const [profitability, setProfitability] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [tradeIns, setTradeIns] = useState<any[]>([]);
  const [showroomCount, setShowroomCount] = useState(0);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('125.00');
  const [branchCount, setBranchCount] = useState(0);
  const [pendingCommissions, setPendingCommissions] = useState(0);
  const [districtOverview, setDistrictOverview] = useState<any[]>([]);
  const [dmBranches, setDmBranches] = useState<any[]>([]);
  
  // UI State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [staffTasks, setStaffTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>(
    () => localStorage.getItem('admin_selected_branch') || 'ALL'
  );
  const [isBranchPickerOpen, setIsBranchPickerOpen] = useState(false);

  // Persist branch selection across pages
  const selectBranch = (id: string, name?: string) => {
    setSelectedBranch(id);
    localStorage.setItem('admin_selected_branch', id);
    localStorage.setItem('admin_selected_branch_name', id === 'ALL' ? 'ALL BRANCHES' : (name || 'Branch'));
    setIsBranchPickerOpen(false);
  };

  useEffect(() => {
    if (!session) return;

    setLoadingMetrics(true);
    let pendingRequests = 0;
    const checkComplete = () => {
      pendingRequests--;
      if (pendingRequests <= 0) setLoadingMetrics(false);
    };
    
    // branchQuery removed: handled globally by api.ts interceptor

    const doFetch = (url: string, onData: (data: any) => void) => {
      pendingRequests++;
      fetchWithCache(url, {}, onData).catch(console.error).finally(checkComplete);
    };

    doFetch(`/staff-performance/leaderboard`, data => setLeaderboard(Array.isArray(data) ? data : []));
    doFetch('/settings', data => { if (data && data.exchange_rate_usd_etb) setExchangeRate(data.exchange_rate_usd_etb); });

    if (role === 'GENERAL_MANAGER') {
      doFetch(`/vehicles/profitability`, data => setProfitability(Array.isArray(data) ? data : []));
      doFetch('/locations', data => {
        setBranchCount(Array.isArray(data) ? data.length : 0);
        setDmBranches(Array.isArray(data) ? data : []);
      });
      doFetch(`/commission-workflow`, data => {
        if (Array.isArray(data)) {
          const pending = data
            .filter((c: any) => !c.isPaid)
            .reduce((sum: number, c: any) => sum + (Number(c.amountEtb) || 0), 0);
          setPendingCommissions(pending);
        }
      });
      doFetch('/locations/districts/overview', data => {
        if (selectedBranch === 'ALL') {
           setDistrictOverview(Array.isArray(data) ? data : []);
        } else {
           setDistrictOverview(Array.isArray(data) ? data.filter((d: any) => d.district_id === selectedBranch) : []);
        }
      });
    }

    if (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER') {
      doFetch(`/people`, data => {
        const active = Array.isArray(data) ? data.filter((s: any) => s.isActive) : [];
        setBranchStaff(active);
      });
    }

    if (role === 'DISTRICT_MANAGER') {
      doFetch('/locations', data => setDmBranches(Array.isArray(data) ? data : []));
    }

    if (role === 'STAFF') {
      doFetch('/staff-tasks', data => setStaffTasks(Array.isArray(data) ? data : []));
    }

    const needsPipelineData = role === 'DISTRICT_MANAGER' || role === 'FINANCE_AUDITOR' || role === 'GENERAL_MANAGER';
    if (needsPipelineData) {
      doFetch(`/staff-budgets`, data => setBudgets(Array.isArray(data) ? data : []));
      doFetch(`/trade-in-requests`, data => setTradeIns(Array.isArray(data) ? data : []));
      doFetch(`/vehicles`, data => setShowroomCount(Array.isArray(data) ? data.length : 0));
    }
    
    if (pendingRequests === 0) setLoadingMetrics(false);
  }, [session, role, selectedBranch]);

  // Actions
  const assignTaskToStaff = async (tradeInId: string, staffId: string) => {
    if (!staffId) return;
    try {
       await api.post('/staff-tasks', {
          assigned_to: staffId,
          trade_in_id: tradeInId,
          priority: 'HIGH',
          description: 'Evaluate Incoming Asset',
          status: 'ASSIGNED'
       });
       
       await api.patch(`/trade-in-requests/${tradeInId}/status`, { status: 'INSPECTION_PENDING' });
       setTradeIns(tradeIns.map(t => t.id === tradeInId ? { ...t, status: 'INSPECTION_PENDING' } : t));
    } catch(e) {
       console.error("Assignment failed", e);
    }
  };

  const escalateToGM = async (tradeInId: string) => {
    try {
       await api.patch(`/trade-in-requests/${tradeInId}/status`, { status: 'ESCALATED_TO_GM' });
       setTradeIns(tradeIns.map(t => t.id === tradeInId ? { ...t, status: 'ESCALATED_TO_GM' } : t));
    } catch(e) {
       console.error(e);
    }
  };

  const approveListing = async (tradeInId: string, price: number) => {
    if (!window.confirm(`Approve and list this vehicle?`)) return;
    try {
       await api.post(`/vehicles/promote/${tradeInId}`, { retailPrice: price });
       setTradeIns(tradeIns.map(t => t.id === tradeInId ? { ...t, status: 'ACCEPTED' } : t));
    } catch(e) {
       console.error(e);
    }
  };

  const handleApproveLead = async (id: string, price: number) => {
    try {
      await api.patch(`/trade-in-requests/${id}/approve`, { offerPrice: price });
      setTradeIns(tradeIns.map(t => t.id === id ? { ...t, status: 'OFFER_MADE', final_dealer_offer_etb: price } : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectLead = async (id: string, reason: string) => {
    try {
      await api.patch(`/trade-in-requests/${id}/reject`, { reason });
      setTradeIns(tradeIns.map(t => t.id === id ? { ...t, status: 'REJECTED' } : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestClarification = async (id: string, reason: string) => {
    try {
      await api.patch(`/trade-in-requests/${id}/status`, { status: 'CLARIFICATION_REQUIRED', notes: reason });
      setTradeIns(tradeIns.map(t => t.id === id ? { ...t, status: 'CLARIFICATION_REQUIRED' } : t));
    } catch (e) {
      console.error(e);
    }
  };

  const updateExchangeRate = () => {
    const newRate = prompt('Enter USD to ETB rate:', exchangeRate);
    if (newRate) {
      api.patch('/settings/exchange-rate', { rate: newRate })
        .then(() => setExchangeRate(newRate))
        .catch(console.error);
    }
  };

  const disburseFunds = (id: string, amount: number) => {
    if (!window.confirm(`Confirm disbursement of ${amount.toLocaleString()} ETB?`)) return;
    api.patch(`/staff-budgets/${id}/disburse`, {})
      .then(() => {
        setBudgets(budgets.map(bg => bg.id === id ? { ...bg, status: 'DISBURSED' } : bg));
      })
      .catch(console.error);
  };

  const totalNetProfit = profitability.reduce((sum, item) => sum + (Number(item.netProfit) || 0), 0);

  // Computed KPIs for DM
  const pendingReviewCount = tradeIns.filter(t => t.status === 'MANAGER_REVIEW').length;
  const newLeadCount = tradeIns.filter(t => t.status === 'NEW_LEAD').length;

  return (
    <div className="space-y-8 pb-20">

      {/* ── MOBILE BRANCH PICKER BOTTOM SHEET ─────────────────────────────── */}
      {isBranchPickerOpen && (
        <div
          className="md:hidden fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-end"
          onClick={() => setIsBranchPickerOpen(false)}
        >
          <div
            className="w-full bg-bg-base rounded-t-[28px] p-5 pb-10 flex flex-col gap-3 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[14px] font-black text-text-main uppercase tracking-wide">Select Branch</p>
              <button onClick={() => setIsBranchPickerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg-secondary">
                <X size={16} className="text-text-muted" />
              </button>
            </div>
            <button
              onClick={() => selectBranch('ALL')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-[14px] border text-left transition-all',
                selectedBranch === 'ALL'
                  ? 'bg-primary-main/10 border-primary-main/30 text-primary-main'
                  : 'bg-surface-card border-border-subtle/30 text-text-main',
              )}
            >
              <Building2 size={16} className="shrink-0" />
              <span className="text-[14px] font-bold">National Overview</span>
              {selectedBranch === 'ALL' && <CheckCircle2 size={14} className="ml-auto text-primary-main" />}
            </button>
            {dmBranches.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-8 h-8 border-4 border-primary-main/20 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[12px] text-text-muted font-bold uppercase tracking-wider">Loading branches...</p>
              </div>
            ) : (
              dmBranches.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => selectBranch(b.id, b.name || b.code)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-[14px] border text-left transition-all',
                    selectedBranch === b.id
                      ? 'bg-primary-main/10 border-primary-main/30 text-primary-main'
                      : 'bg-surface-card border-border-subtle/30 text-text-main',
                  )}
                >
                  <MapPin size={16} className="shrink-0" />
                  <span className="text-[14px] font-bold">{b.name || b.code}</span>
                  {selectedBranch === b.id && <CheckCircle2 size={14} className="ml-auto text-primary-main" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE STICKY BRANCH BANNER (GM only) ───────────────────── */}
      {role === 'GENERAL_MANAGER' && (
        <div className="md:hidden sticky top-0 z-40 bg-bg-base -mx-4 px-4 pb-2">
          <div className="h-[40px] flex items-center">
            <button
              onClick={() => setIsBranchPickerOpen(true)}
              className="flex items-center gap-2 text-text-main font-black uppercase tracking-wide text-[16px]"
            >
              {selectedBranch === 'ALL'
                ? 'ALL BRANCHES'
                : (dmBranches.find((b: any) => b.id === selectedBranch)?.name || localStorage.getItem('admin_selected_branch_name') || 'Branch')}
              <ChevronDown size={18} />
            </button>
          </div>
          <div className="bg-surface-card rounded-[16px] px-4 py-3 shadow-sm border border-border-subtle/30 flex items-center gap-3">
            <Activity size={20} className="text-[#1976d2] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black tracking-tight text-text-main">Command Center</p>
              <p className="text-[10px] text-text-muted font-medium truncate">Real-time branch performance overview</p>
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
        </div>
      )}
      {/* Welcome Header */}
      <div className="pb-6 border-b border-border-subtle/30 flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div className="space-y-1">
            <p className="text-[13px] text-text-muted/60">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Welcome back, {ADMIN_NAME.split(' ')[0]}</h1>
             <div className="flex items-center gap-2 mt-1.5">
               {LOCATION_NAME && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(LOCATION_NAME) && (
                 <>
                   <div className="flex items-center gap-1.5 text-[13px] text-text-muted">
                      <Building2 size={14} className="text-primary-main" /> {LOCATION_NAME}
                   </div>
                   <span className="w-1 h-1 bg-border-subtle/30 rounded-full" />
                 </>
               )}
               <Badge variant="primary">{(role || '').replace(/_/g, ' ')}</Badge>
            </div>
         </div>
         
         {/* Branch Filter Dropdown */}
        {role === 'GENERAL_MANAGER' && (
          <div className="flex items-center gap-2">
             <span className="text-[13px] font-medium text-text-muted">Viewing:</span>
             <select 
               className="bg-surface-card border border-border-subtle text-[13px] md:text-[14px] font-semibold h-10 px-3 pr-8 rounded-xl text-text-main outline-none focus:border-primary-main/50 appearance-none cursor-pointer shadow-sm transition-all"
               value={selectedBranch}
               onChange={(e) => setSelectedBranch(e.target.value)}
             >
               <option value="ALL">National Overview</option>
               {dmBranches.map(b => (
                 <option key={b.id} value={b.id}>{b.name || b.code}</option>
               ))}
             </select>
           </div>
         )}
      </div>

      <div className="space-y-8">
        {role === "GENERAL_MANAGER" && (
          <>
            <GeneralManagerView 
              loadingMetrics={loadingMetrics}
              totalNetProfit={totalNetProfit}
              pendingCommissions={pendingCommissions}
              branchCount={branchCount}
              exchangeRate={exchangeRate}
              tradeIns={tradeIns}
              districtOverview={districtOverview}
              dmBranches={dmBranches}
              budgets={budgets}
              branchStaff={branchStaff}
              onUpdateExchangeRate={updateExchangeRate}
              onApproveListing={approveListing}
              onApprove={handleApproveLead}
              onReject={handleRejectLead}
              onViewReport={(lead) => setSelectedReport(lead)}
            />
            <div className="my-10" />
          </>
        )}

        {(role === "DISTRICT_MANAGER" || role === "GENERAL_MANAGER") && (
          <>
            {/* DM KPI Cards — Square, Colorful, Small Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {loadingMetrics ? (
                <>
                  <SkeletonKpi className="h-28" />
                  <SkeletonKpi className="h-28" />
                  <SkeletonKpi className="h-28" />
                  <SkeletonKpi className="h-28" />
                </>
              ) : (
                <>
                  <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-4 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center text-primary-main">
                      <ClipboardCheck size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-main tracking-tight">{pendingReviewCount}</p>
                      <p className="text-[13px] text-text-muted mt-0.5">Pending Review</p>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-4 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
                      <CarFront size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-main tracking-tight">{showroomCount}</p>
                      <p className="text-[13px] text-text-muted mt-0.5">Showroom Assets</p>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-4 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-main tracking-tight">{newLeadCount}</p>
                      <p className="text-[13px] text-text-muted mt-0.5">New Leads</p>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-4 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center text-primary-main">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-main tracking-tight">{branchStaff.filter(s => s.role === 'STAFF').length}</p>
                      <p className="text-[13px] text-text-muted mt-0.5">Branch Staff</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DistrictManagerView 
              tradeIns={tradeIns}
              showroomCount={showroomCount}
              budgets={budgets}
              branchStaff={branchStaff}
              dmBranches={dmBranches}
              role={role}
              loadingMetrics={loadingMetrics}
              selectedBranchId={selectedBranch}
              activeQueueTab={'Authorization Pending'}
              onAssignTask={assignTaskToStaff}
              onApprove={handleApproveLead}
              onReject={handleRejectLead}
              onViewReport={(lead) => setSelectedReport(lead)}
              onEscalate={escalateToGM}
            />

            <div className="my-10 border-t border-border-subtle/30" />

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Inspection Reports', desc: 'Review technician submissions', href: '/inspections', icon: <ShieldCheck size={18} />, color: 'text-primary-main bg-primary-main/10' },
                { label: 'Acquisitions Pipeline', desc: 'Full lead management board', href: '/acquisitions', icon: <CarFront size={18} />, color: 'text-success bg-success/10' },
                { label: 'Branch Staff', desc: 'Manage your team', href: '/staff', icon: <Users size={18} />, color: 'text-primary-main bg-primary-main/10' },
              ].map(link => (
                <a 
                  key={link.label}
                  href={link.href} 
                  className="bg-surface-card border border-border-subtle/30 rounded-2xl p-4 flex items-center gap-3.5 group hover:bg-bg-secondary active:scale-[0.98] transition-all"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", link.color)}>
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-text-main">{link.label}</p>
                    <p className="text-[13px] text-text-muted/60">{link.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted/40 group-hover:text-primary-main group-hover:translate-x-1 transition-all shrink-0" />
                </a>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="space-y-3">
               <div className="px-1">
                  <h2 className="text-[15px] font-semibold text-text-main">Top Performers</h2>
                  <p className="text-[13px] text-text-muted">By closed settlements</p>
               </div>
               <div className="bg-surface-card rounded-2xl border border-border-subtle/30 overflow-hidden">
                  {leaderboard.slice(0, 5).map((agent, idx) => (
                    <Tooltip key={agent.id} content={`Role: ${agent.role?.replace(/_/g, ' ')}`}>
                      <div className={cn("flex items-center justify-between px-4 py-3.5 hover:bg-bg-secondary transition-colors cursor-help", idx < 4 && "border-b border-border-subtle/30")}>
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px]",
                             idx === 0 ? "bg-warning/10 text-warning" : "bg-bg-secondary text-text-muted"
                           )}>
                             {idx === 0 ? <Trophy size={16} /> : `${idx + 1}`}
                           </div>
                           <div>
                             <p className="text-[15px] font-medium text-text-main">{agent.fullName}</p>
                             <p className="text-[13px] text-text-muted/60 capitalize">{agent.role?.replace(/_/g, ' ').toLowerCase()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[17px] font-bold text-text-main">{agent.totalSales || 0}</p>
                           <p className="text-[12px] text-text-muted/60">settled</p>
                        </div>
                      </div>
                    </Tooltip>
                  ))}
               </div>
            </div>
          </>
        )}

        {role === "FINANCE_AUDITOR" && (
          <FinanceAuditorView 
            budgets={budgets}
            onDisburse={disburseFunds}
          />
        )}

        {role === "STAFF" && (
          <StaffView 
            tasks={staffTasks}
            onStartInspection={(task) => {
              setSelectedTask(task);
              setIsInspectionModalOpen(true);
            }}
          />
        )}

        {role === "BROKER" && (
           <div className="bg-surface-card rounded-2xl border border-border-subtle border-dashed py-16 text-center flex flex-col items-center justify-center gap-4">
             <CarFront className="text-text-muted opacity-20" size={40} />
             <p className="text-[15px] text-text-muted max-w-xs">Referral hub active. Start an asset evaluation.</p>
             <Button variant="primary" size="lg">Initiate Lead</Button>
           </div>
        )}
      </div>

      <LogViewerModal 
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        onViewReport={(lead) => setSelectedReport(lead)}
        locationName={LOCATION_NAME}
      />

      <InspectionReportView 
        lead={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onApprove={handleApproveLead}
        onReject={handleRejectLead}
        onRequestClarification={handleRequestClarification}
      />

      {selectedTask && (
        <DetailedInspectionModal 
          isOpen={isInspectionModalOpen}
          onClose={() => setIsInspectionModalOpen(false)}
          task={selectedTask}
          onSubmit={async (data) => {
            try {
              await api.post('/trade-in-requests/inspection', data);
              setIsInspectionModalOpen(false);
              
              const [updatedLeads, updatedTasks] = await Promise.all([
                api.get<any[]>('/trade-in-requests'),
                api.get<any[]>('/staff-tasks')
              ]);
              
              setTradeIns(updatedLeads);
              setStaffTasks(updatedTasks);
              alert('Evaluation submitted and logged to official registry.');
            } catch (e) {
              console.error(e);
              alert('Evaluation transmission failed.');
            }
          }}
        />
      )}
    </div>
  );
}
