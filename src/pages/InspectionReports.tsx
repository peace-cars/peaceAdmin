/**
 * InspectionReports.tsx
 *
 * Componentized and restyled to match InventoryManager UI pattern.
 * Sub-components: ReportsKpis
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache, apiCache } from '../lib/cache';
import { InspectionReportsPage as ReportsList } from '../components/dashboard/InspectionReportsPage';
import { InspectionReportView } from '../components/dashboard/InspectionReportView';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile KPIs
// ─────────────────────────────────────────────────────────────────────────────
interface ReportsKpisProps {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  avgHealthScore: number;
}

const ReportsKpis: React.FC<ReportsKpisProps> = ({
  pendingCount,
  approvedCount,
  rejectedCount,
  avgHealthScore,
}) => (
  <div className="flex flex-col gap-3">
    {/* Primary card */}
    <div className="bg-surface-card rounded-[20px] shadow-sm border border-border-subtle/30 overflow-hidden relative">
      <div className="p-5 pb-14">
        <div className="flex justify-between items-start">
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
            Average Health Score
          </p>
          <ShieldCheck size={16} className="text-primary-main" />
        </div>
        <p className="mt-2 text-[26px] font-black tracking-tight text-primary-main">
          {Math.round(avgHealthScore)}
          <span className="text-[14px] font-bold text-primary-main/60 ml-1">%</span>
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
        { label: 'Pending Review', value: String(pendingCount), icon: <Clock size={14} />, color: 'text-amber-400' },
        { label: 'Approved', value: String(approvedCount), icon: <CheckCircle2 size={14} />, color: 'text-emerald-400' },
        { label: 'Rejected', value: String(rejectedCount), icon: <AlertTriangle size={14} />, color: 'text-rose-400' },
        { label: 'Total Assessed', value: String(pendingCount + approvedCount + rejectedCount), icon: <ClipboardCheck size={14} />, color: 'text-text-muted' },
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
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function InspectionReports() {
  const { session } = useAuth();
  const [tradeIns, setTradeIns] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'MANAGER_REVIEW' | 'OFFER_MADE' | 'REJECTED'
  >('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = () => {
    fetchWithCache('/trade-in-requests', {}, (data) => {
      setTradeIns(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleApproveLead = async (id: string, price: number) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/trade-in-requests/${id}/approve`, { offerPrice: price });
      apiCache.clear();
      setTradeIns((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: 'OFFER_MADE', final_dealer_offer_etb: price } : t,
        ),
      );
      setSelectedReport(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectLead = async (id: string, reason: string) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/trade-in-requests/${id}/reject`, { reason });
      apiCache.clear();
      setTradeIns((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'REJECTED' } : t)));
      setSelectedReport(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter only items that have inspections or are in review states
  const reviewable = tradeIns.filter(
    (t) => t.status === 'MANAGER_REVIEW' || t.status === 'OFFER_MADE' || t.status === 'REJECTED',
  );

  const filtered = reviewable.filter((t) => {
    const matchesSearch =
      search === '' ||
      (t.vehicle || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.customer || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPIs
  const pendingCount = reviewable.filter((t) => t.status === 'MANAGER_REVIEW').length;
  const approvedCount = reviewable.filter((t) => t.status === 'OFFER_MADE').length;
  const rejectedCount = reviewable.filter((t) => t.status === 'REJECTED').length;
  const avgHealthScore =
    reviewable.reduce((sum, t) => {
      const ins = t.inspections?.[0];
      if (!ins) return sum;
      return (
        sum +
        Math.round(
          ((ins.mechanical_score || 0) + (ins.exterior_score || 0) + (ins.interior_score || 0)) / 3,
        )
      );
    }, 0) / (reviewable.filter((t) => t.inspections?.[0]).length || 1);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-main/20  rounded-full animate-spin" />
          <p className="text-primary-main font-bold text-[12px] font-medium">
            Loading Evaluation Dossiers...
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* ─── DESKTOP STICKY HEADER ─── */}
      <div className="hidden md:block sticky top-0 z-30 -mx-4 md:-mx-8 -mt-5 md:-mt-8 border-b border-border-subtle/30 bg-bg-base/95 px-4 py-4 shadow-sm backdrop-blur-md md:px-8">
        <div className="rounded-[28px] border border-border-subtle/70 bg-surface-card/95 p-4 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <ClipboardCheck size={22} className="text-primary-main" />
              <h1 className="text-xl font-black text-text-main tracking-tight">
                Inspection Reports
              </h1>
            </div>
            {/* Search + Filter */}
            <div className="flex items-center gap-2">
              <div className="relative group w-64">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/40 group-focus-within:text-primary-main transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search vehicle or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-bg-secondary border border-border-subtle rounded-xl h-11 pl-10 pr-4 text-[13px] text-text-main focus:outline-none focus:border-primary-main/30 focus:ring-2 focus:ring-primary-main/10 transition-all w-full placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP KPI GRID ─── */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4 h-32 shadow-sm">
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-2xl font-black text-text-main tracking-tight">{pendingCount}</p>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-1">Pending Review</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4 h-32 shadow-sm">
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-2xl font-black text-text-main tracking-tight">{approvedCount}</p>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-1">Approved</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4 h-32 shadow-sm">
          <div className="w-10 h-10 bg-error-main/10 rounded-xl flex items-center justify-center text-error-main">
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className="text-2xl font-black text-text-main tracking-tight">{rejectedCount}</p>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-1">Rejected</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4 h-32 shadow-sm">
          <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center text-primary-main">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-2xl font-black text-text-main tracking-tight">
              {Math.round(avgHealthScore)}%
            </p>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-1">Avg Health</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MOBILE SECTION
      ══════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-4">

        {/* ── Single sticky banner: ALL BRANCHES + Dossier title + filter tabs ── */}
        <div className="sticky top-0 z-40 bg-bg-base -mx-4 px-4 pb-2">
          {/* Row 1: Branch label (set from Dashboard) */}
          <div className="h-[40px] flex items-center">
            <span className="text-text-main font-black uppercase tracking-wide text-[16px]">
              {localStorage.getItem('admin_selected_branch_name') || 'ALL BRANCHES'}
            </span>
          </div>
          {/* Row 2: Evaluation Dossiers card */}
          <div className="bg-surface-card rounded-[16px] px-4 py-3 shadow-sm border border-border-subtle/30 flex items-center gap-3 mb-2">
            <ClipboardCheck size={20} className="text-[#1976d2] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black tracking-tight text-text-main">
                Evaluation Dossiers
              </p>
              <p className="text-[10px] text-text-muted font-medium truncate">
                Vehicle inspection and health reports
              </p>
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
          {/* Row 3: Filter tabs */}
          <div className="flex bg-bg-secondary p-1 rounded-xl overflow-x-auto no-scrollbar w-full border border-border-subtle/30 shadow-sm">
            {[
              { id: 'all', label: 'All' },
              { id: 'MANAGER_REVIEW', label: 'Pending' },
              { id: 'OFFER_MADE', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={cn(
                  'px-3 py-2 text-[12px] font-bold rounded-lg transition-all whitespace-nowrap',
                  statusFilter === f.id
                    ? 'bg-surface-card text-primary-main shadow-sm'
                    : 'text-text-muted hover:text-text-main',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile KPI cards */}
        <ReportsKpis
          pendingCount={pendingCount}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          avgHealthScore={avgHealthScore}
        />
      </div>

      {/* Desktop Tabs (Only visible on desktop) */}
      <div className="hidden md:flex items-center gap-1 bg-bg-secondary border border-border-subtle rounded-xl p-1 w-fit shadow-sm">
        {[
          { id: 'all', label: 'All' },
          { id: 'MANAGER_REVIEW', label: 'Pending Review' },
          { id: 'OFFER_MADE', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id as any)}
            className={cn(
              'px-4 py-2 text-[12px] font-medium rounded-lg transition-all',
              statusFilter === f.id
                ? 'bg-text-main text-bg shadow'
                : 'text-text-muted hover:text-text-main',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid of cards */}
      <ReportsList
        tradeIns={filtered}
        onSelectReport={setSelectedReport}
        statusFilter={statusFilter}
        searchFilter={search}
      />

      <InspectionReportView
        lead={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onApprove={handleApproveLead}
        onReject={handleRejectLead}
      />
    </div>
  );
}
