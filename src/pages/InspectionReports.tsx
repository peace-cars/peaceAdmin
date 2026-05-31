import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Activity,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { InspectionReportsPage as ReportsList } from '../components/dashboard/InspectionReportsPage';
import { InspectionReportView } from '../components/dashboard/InspectionReportView';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

export default function InspectionReports() {
  const { session } = useAuth();
  const [tradeIns, setTradeIns] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'MANAGER_REVIEW' | 'OFFER_MADE' | 'REJECTED'
  >('all');

  const fetchData = async () => {
    try {
      const data = await api.get<any[]>('/trade-in-requests');
      setTradeIns(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleApproveLead = async (id: string, price: number) => {
    try {
      await api.patch(`/trade-in-requests/${id}/approve`, { offerPrice: price });
      setTradeIns((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: 'OFFER_MADE', final_dealer_offer_etb: price } : t,
        ),
      );
      setSelectedReport(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectLead = async (id: string, reason: string) => {
    try {
      await api.patch(`/trade-in-requests/${id}/reject`, { reason });
      setTradeIns((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'REJECTED' } : t)));
      setSelectedReport(null);
    } catch (e) {
      console.error(e);
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
          <div className="w-10 h-10 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
          <p className="text-primary-main font-bold text-[12px] font-medium">
            Loading Evaluation Dossiers...
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-8 pb-20">


      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-main tracking-tight">{pendingCount}</p>
            <p className="text-[11px] font-bold text-text-muted font-medium">Pending Review</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-main tracking-tight">{approvedCount}</p>
            <p className="text-[11px] font-bold text-text-muted font-medium">Approved</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-error-main/10 rounded-xl flex items-center justify-center text-error-main">
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-main tracking-tight">{rejectedCount}</p>
            <p className="text-[11px] font-bold text-text-muted font-medium">Rejected</p>
          </div>
        </div>
        <div className="bg-surface-card border border-border-subtle/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center text-primary-main">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-main tracking-tight">
              {Math.round(avgHealthScore)}%
            </p>
            <p className="text-[11px] font-bold text-text-muted font-medium">Avg Health</p>
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30"
            size={14}
          />
          <input
            type="text"
            placeholder="Search by vehicle or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 pl-11 pr-6 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-main/30 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-bg-secondary border border-border-subtle rounded-xl p-1">
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
      </div>

      {/* Pass filtered items with all statuses to the list */}
      <ReportsList
        tradeIns={
          statusFilter === 'all'
            ? tradeIns.filter((t) =>
                ['MANAGER_REVIEW', 'OFFER_MADE', 'REJECTED'].includes(t.status),
              )
            : tradeIns
        }
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
