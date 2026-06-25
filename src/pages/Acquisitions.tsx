/**
 * Acquisitions.tsx  (Pipeline page)
 *
 * Componentized for maintainability. Sub-components:
 *   PipelineKpis, StageTabBar, LeadCard, LeadGrid, DesktopKanban
 *
 * All original functionality is preserved.
 */

import React, { useState, useEffect } from 'react';
import {
  MoreHorizontal,
  Plus,
  Search,
  Clock,
  Car,
  ChevronDown,
  ChevronRight,
  User,
  Zap,
  MapPin,
  LayoutGrid,
  List,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Layers,
  Heart,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache, apiCache } from '../lib/cache';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../lib/utils';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { EvaluationReport } from '../components/documents/EvaluationReport';
import { InspectionReportView } from '../components/dashboard/InspectionReportView';
import { AcquisitionDossierModal } from '../components/ui/AcquisitionDossierModal';
import { ProgressiveImage } from '../components/ui/ProgressiveImage';
import { SkeletonKpi } from '../components/ui/Skeleton';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const initialColumns: { id: string; title: string; items: any[] }[] = [
  { id: 'new', title: 'Inbound Assets', items: [] },
  { id: 'appraisal', title: 'Technical Evaluation', items: [] },
  { id: 'review', title: 'Senior Authorization', items: [] },
  { id: 'offer', title: 'Procurement Settlement', items: [] },
  { id: 'acquired', title: 'Registry Secured', items: [] },
];

const statusMap: Record<string, string[]> = {
  new: ['NEW_LEAD'],
  appraisal: ['INSPECTION_PENDING', 'CLARIFICATION_REQUIRED'],
  review: ['MANAGER_REVIEW'],
  offer: ['OFFER_MADE', 'NEGOTIATING', 'STALE'],
  acquired: ['ACCEPTED', 'RECONDITIONING'],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  switch (status) {
    case 'NEW_LEAD': return 'bg-primary-main';
    case 'INSPECTION_PENDING': return 'bg-warning';
    case 'CLARIFICATION_REQUIRED': return 'bg-warning/80';
    case 'MANAGER_REVIEW': return 'bg-accent';
    case 'OFFER_MADE': return 'bg-success';
    case 'NEGOTIATING': return 'bg-primary-main/80';
    case 'STALE': return 'bg-text-muted';
    case 'ACCEPTED': return 'bg-text-main';
    case 'RECONDITIONING': return 'bg-accent/60';
    case 'CLOSED_LOST': return 'bg-error-main';
    case 'REJECTED': return 'bg-error-main/80';
    default: return 'bg-text-muted';
  }
}

/** Safely strip underscores without a regex literal (OXC-safe) */
function statusLabel(status: string): string {
  return status.split('_')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile KPI summary cards
// ─────────────────────────────────────────────────────────────────────────────
interface PipelineKpisProps {
  columns: { id: string; title: string; items: any[] }[];
  totalLeads: number;
  loading: boolean;
}

const PipelineKpis: React.FC<PipelineKpisProps> = ({ columns, totalLeads, loading }) => {
  const acquired = columns.find((c) => c.id === 'acquired')?.items.length ?? 0;
  const pending = columns.find((c) => c.id === 'appraisal')?.items.length ?? 0;
  const inbound = columns.find((c) => c.id === 'new')?.items.length ?? 0;
  const settlement = columns.find((c) => c.id === 'offer')?.items.length ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Primary KPI card */}
      {loading ? (
        <SkeletonKpi className="h-32" />
      ) : (
        <div className="bg-surface-card rounded-[20px] shadow-sm border border-border-subtle/30 overflow-hidden relative">
          <div className="p-5 pb-14">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
                Active Pipeline
              </p>
              <TrendingUp size={16} className="text-text-muted" />
            </div>
            <p className="mt-2 text-[28px] font-black tracking-tight text-text-main">
              {totalLeads}
              <span className="text-[14px] font-bold text-text-muted ml-2">leads</span>
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
                d="M0,36 C60,20 120,44 180,28 C240,12 300,38 360,22 C380,16 395,28 400,24 L400,48 L0,48 Z"
                fill="currentColor"
                fillOpacity="0.1"
              />
              <path
                d="M0,36 C60,20 120,44 180,28 C240,12 300,38 360,22 C380,16 395,28 400,24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      )}

      {/* 2×2 KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <SkeletonKpi className="h-28" />
            <SkeletonKpi className="h-28" />
            <SkeletonKpi className="h-28" />
            <SkeletonKpi className="h-28" />
          </>
        ) : (
          [
            { label: 'Inbound', value: String(inbound), icon: <Layers size={14} />, color: 'text-primary-main' },
            { label: 'In Evaluation', value: String(pending), icon: <AlertCircle size={14} />, color: 'text-amber-400' },
            { label: 'Acquired', value: String(acquired), icon: <CheckCircle size={14} />, color: 'text-emerald-400' },
            { label: 'In Settlement', value: String(settlement), icon: <Zap size={14} />, color: 'text-text-muted' },
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
              <p className="mt-2 text-[18px] font-black tracking-tight text-text-main">{value}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Stage tab bar (mobile horizontal scroll)
// ─────────────────────────────────────────────────────────────────────────────
interface StageTabBarProps {
  columns: { id: string; title: string; items: any[] }[];
  activeTab: string;
  onSelect: (id: string) => void;
  getTitle: (id: string) => string;
}

const StageTabBar: React.FC<StageTabBarProps> = ({ columns, activeTab, onSelect, getTitle }) => (
  <div className="flex bg-bg-secondary p-1 rounded-xl overflow-x-auto no-scrollbar w-full">
    {columns.map((col) => (
      <button
        key={col.id}
        onClick={() => onSelect(col.id)}
        className={cn(
          'px-3 py-2 text-[12px] font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap',
          activeTab === col.id
            ? 'bg-surface-card text-primary-main shadow-sm'
            : 'text-text-muted hover:text-text-main',
        )}
      >
        {getTitle(col.id)}
        <Badge variant={activeTab === col.id ? 'primary' : 'default'}>
          {col.items.length}
        </Badge>
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Single lead card
// ─────────────────────────────────────────────────────────────────────────────
interface LeadCardProps {
  item: any;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ item, viewMode, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      'flex flex-col bg-surface-card rounded-[16px] overflow-hidden border border-border-subtle/30 shadow-sm cursor-pointer active:scale-[0.97] transition-transform',
      viewMode === 'list' && 'flex-row items-center p-3 gap-3'
    )}
  >
    {/* Image */}
    <div
      className={cn(
        'relative bg-bg-secondary overflow-hidden shrink-0',
        viewMode === 'grid' ? 'w-full aspect-[4/3]' : 'w-24 h-20 rounded-xl border border-border-subtle/50'
      )}
    >
      {item.photos && item.photos.length > 0 ? (
        <ProgressiveImage
          src={item.photos[0]}
          alt={item.vehicle}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Car size={20} className="text-text-muted opacity-30" />
        </div>
      )}

      {/* Status badge top-left */}
      {viewMode === 'grid' && (
        <div
          className={cn(
            'absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[8px] font-bold shadow-sm uppercase border',
            getStatusColor(item.status).includes('success') ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
            getStatusColor(item.status).includes('warning') ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
            getStatusColor(item.status).includes('primary') ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
            getStatusColor(item.status).includes('error') ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
            'bg-bg-secondary text-text-muted border-border-subtle/30'
          )}
        >
          {statusLabel(item.status)}
        </div>
      )}

      {/* Heart top-right */}
      {viewMode === 'grid' && (
        <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm">
          <Heart size={12} className="text-white" />
        </div>
      )}

      {/* Photo Count overlay */}
      {item.photos && item.photos.length > 1 && (
        <div className="absolute bottom-1 right-1 bg-black/80 text-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm">
          {item.photos.length}P
        </div>
      )}
    </div>

    {/* Details */}
    <div
      className={cn(
        'flex flex-col justify-between flex-grow min-w-0',
        viewMode === 'grid' ? 'p-2.5 gap-1' : 'py-1'
      )}
    >
      {viewMode === 'grid' ? (
        <>
          <h4 className="text-[11px] font-bold text-text-main leading-tight truncate">
            {item.vehicle}
          </h4>
          <p className="text-[9px] text-text-muted font-medium truncate">
            {item.customer} &bull; {item.time}
          </p>
          <p className="text-[13px] font-black text-text-main">
            {(item.askingPrice || 0).toLocaleString()} ETB
          </p>
          {/* Status / Location pill */}
          <span
            className={cn(
              'self-start rounded-full px-2 py-0.5 text-[8px] font-bold border mt-0.5 text-text-muted border-border-subtle/30 bg-bg-secondary'
            )}
          >
            {item.location || 'Central'}
          </span>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-black text-text-main truncate group-hover:text-primary-main transition-colors leading-tight">
                {item.vehicle}
              </p>
              <p className="text-[11px] font-medium text-text-muted truncate mt-1 flex items-center gap-1.5">
                <User size={12} className="text-text-muted shrink-0" />
                <span>{item.customer}</span>
              </p>
            </div>
            <div className="text-right shrink-0 bg-bg-base px-2 py-1 rounded-md border border-border-subtle/50">
              <p className="text-[13px] font-black text-success leading-none">
                {(item.askingPrice || 0).toLocaleString()}
              </p>
              <p className="text-[9px] text-text-muted font-bold uppercase mt-0.5">ETB</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border-subtle">
            <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold">
              <span className="flex items-center gap-1">
                <Clock size={10} /> {item.time}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {item.location || 'Central'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-bg-secondary px-2 py-0.5 rounded-full border border-border-subtle/50">
              <div className={cn('w-2 h-2 rounded-full', getStatusColor(item.status))} />
              <span className="text-[9px] font-bold text-text-main uppercase tracking-wider">
                {statusLabel(item.status)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Lead grid (active stage's cards)
// ─────────────────────────────────────────────────────────────────────────────
interface LeadGridProps {
  column: { id: string; title: string; items: any[] };
  viewMode: 'grid' | 'list';
  loading: boolean;
  getTitle: (id: string) => string;
  onSelect: (item: any) => void;
}

const LeadGrid: React.FC<LeadGridProps> = ({ column, viewMode, loading, getTitle, onSelect }) => (
  <div className="flex flex-col gap-4">
    {/* Column header */}
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <h3 className="text-[15px] font-black text-text-main">{getTitle(column.id)}</h3>
        <Badge variant="primary">{column.items.length}</Badge>
      </div>
      <Tooltip content="Stage Options">
        <button className="text-text-muted hover:text-text-main transition-all p-2 hover:bg-bg-secondary rounded-xl">
          <MoreHorizontal size={16} />
        </button>
      </Tooltip>
    </div>

    {/* Cards grid */}
    <div
      className={cn(
        'flex-1 transition-all min-h-[200px]',
        viewMode === 'list' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-2 gap-2 sm:gap-3',
      )}
    >
      {loading ? (
        <>
          <div className={cn("rounded-2xl bg-border-subtle/40 animate-pulse", viewMode === 'list' ? "h-20" : "h-40")} />
          <div className={cn("rounded-2xl bg-border-subtle/40 animate-pulse", viewMode === 'list' ? "h-20" : "h-40")} />
          <div className={cn("rounded-2xl bg-border-subtle/40 animate-pulse", viewMode === 'list' ? "h-20" : "h-40")} />
          <div className={cn("rounded-2xl bg-border-subtle/40 animate-pulse", viewMode === 'list' ? "h-20" : "h-40")} />
        </>
      ) : column.items.length === 0 ? (
        <div className="col-span-full py-16 text-center flex flex-col items-center gap-3 bg-surface-card rounded-2xl border border-dashed border-border-subtle">
          <Car size={28} className="text-text-muted opacity-20" />
          <div>
            <p className="text-[14px] text-text-muted">No active items in this stage</p>
            <p className="text-[12px] text-text-muted/60 mt-0.5">
              New leads will appear here when they enter this stage
            </p>
          </div>
        </div>
      ) : (
        column.items.map((item: any) => (
          <LeadCard
            key={item.id}
            item={item}
            viewMode={viewMode}
            onClick={() => onSelect(item)}
          />
        ))
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Desktop Kanban (all columns side-by-side)
// ─────────────────────────────────────────────────────────────────────────────
interface DesktopKanbanProps {
  visibleColumns: { id: string; title: string; items: any[] }[];
  viewMode: 'grid' | 'list';
  getTitle: (id: string) => string;
  onSelect: (item: any) => void;
  activeTab: string;
}

const DesktopKanban: React.FC<DesktopKanbanProps> = ({
  visibleColumns,
  viewMode,
  getTitle,
  onSelect,
  activeTab,
}) => (
  <div
    className={cn(
      'hidden md:flex gap-8 overflow-x-auto pb-16 no-scrollbar',
      activeTab === 'all' ? 'justify-start' : 'justify-center',
    )}
  >
    {visibleColumns.map((column) => (
      <div
        key={column.id}
        className={cn(
          'flex flex-col gap-6 transition-all duration-500',
          activeTab === 'all' ? 'min-w-80' : 'w-full max-w-6xl',
        )}
      >
        <LeadGrid
          column={column}
          viewMode={viewMode}
          getTitle={getTitle}
          onSelect={onSelect}
          loading={false}
        />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const Acquisitions = () => {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [columns, setColumns] = useState(initialColumns);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [printReportOpen, setPrintReportOpen] = useState(false);
  const [viewReportOpen, setViewReportOpen] = useState(false);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = () => {
    fetchWithCache('/people', {}, (data) => {
      setBranchStaff(
        Array.isArray(data) ? data.filter((s: any) => s.isActive && s.role === 'STAFF') : [],
      );
    }).catch((err) => console.error('[Acquisitions] Fetch Staff Failed', err));
  };

  const fetchLeads = (bypassCache = false) => {
    const endpoint = bypassCache ? `/trade-in-requests?_t=${Date.now()}` : '/trade-in-requests';
    fetchWithCache(endpoint, {}, (allLeads) => {
      const newCols = initialColumns.map((col) => ({
        ...col,
        items: (Array.isArray(allLeads) ? allLeads : [])
          .filter((lead: any) => {
            const searchStr = `${lead.vehicle || ''} ${lead.customer || ''}`.toLowerCase();
            if (searchQuery && !searchStr.includes(searchQuery.toLowerCase())) return false;
            return statusMap[col.id]?.includes(lead.status);
          })
          .map((lead: any) => ({
            ...lead,
            time: lead.arrivedAt
              ? new Date(lead.arrivedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Today',
          })),
      }));
      setColumns(newCols);
    }).catch((err) => console.error('[Acquisitions] Fetch Failed', err));
  };

  const assignStaff = async (tradeInId: string, staffId: string) => {
    if (!staffId) return;
    setIsSubmitting(true);
    try {
      await api.post('/staff-tasks', {
        assigned_to: staffId,
        trade_in_id: tradeInId,
        priority: 'HIGH',
        description: 'Evaluate Incoming Asset',
        status: 'ASSIGNED',
      });
      await api.patch(`/trade-in-requests/${tradeInId}/status`, {
        status: 'INSPECTION_PENDING',
      });
      apiCache.clear();
      fetchLeads(true);
      if (selectedLead?.id === tradeInId) setSelectedLead(null);
      alert('Staff assigned for technical evaluation.');
    } catch (err) {
      console.error('[Acquisitions] Assignment Failed', err);
      alert('Assignment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/trade-in-requests/${leadId}/status`, { status: newStatus });
      apiCache.clear();
      fetchLeads(true);
      setSelectedLead(null);
    } catch (err) {
      console.error('[Acquisitions] Update Failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string, price: number) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/trade-in-requests/${id}/approve`, { offerPrice: price });
      apiCache.clear();
      fetchLeads(true);
      setSelectedLead(null);
      setViewReportOpen(false);
    } catch (err) {
      console.error('[Acquisitions] Approve Failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/trade-in-requests/${id}/reject`, { reason });
      apiCache.clear();
      fetchLeads(true);
      setSelectedLead(null);
      setViewReportOpen(false);
    } catch (err) {
      console.error('[Acquisitions] Reject Failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClarification = async (id: string, _reason: string) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/trade-in-requests/${id}/status`, {
        status: 'CLARIFICATION_REQUIRED',
      });
      apiCache.clear();
      fetchLeads(true);
      setSelectedLead(null);
      setViewReportOpen(false);
    } catch (err) {
      console.error('[Acquisitions] Clarification Failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchLeads();
      fetchStaff();
    }
  }, [session, searchQuery]);

  const visibleColumns = columns.filter((c) => c.id === activeTab);
  const totalLeads = columns.reduce((sum, col) => sum + col.items.length, 0);

  const getTranslatedTitle = (id: string) => {
    switch (id) {
      case 'new': return t('acquisitions.inbound');
      case 'appraisal': return t('acquisitions.evaluation');
      case 'review': return t('acquisitions.authorization');
      case 'offer': return t('acquisitions.settlement');
      case 'acquired': return t('acquisitions.secured');
      default: return id;
    }
  };

  return (
    <div className="animate-fade-in relative min-h-screen pb-24">

      {/* ─── DESKTOP STICKY HEADER ─── */}
      <div className="hidden md:block sticky top-0 z-30 -mx-4 md:-mx-8 -mt-1 md:-mt-4 border-b border-border-subtle/30 bg-bg-base px-4 py-4 shadow-sm md:px-8">
        <div className="rounded-[28px] border border-border-subtle/70 bg-surface-card p-4 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] md:p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Stage tab bar */}
            <StageTabBar
              columns={columns}
              activeTab={activeTab}
              onSelect={setActiveTab}
              getTitle={getTranslatedTitle}
            />

            {/* Search + view toggle */}
            <div className="flex items-center gap-2">
              <div className="relative group w-64">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/40 group-focus-within:text-primary-main transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder={t('acquisitions.filter_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-bg-secondary border border-border-subtle rounded-xl h-11 pl-10 pr-4 text-[13px] text-text-main focus:outline-none focus:border-primary-main/30 focus:ring-2 focus:ring-primary-main/10 transition-all w-full placeholder:text-text-muted"
                />
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-bg-secondary rounded-xl border border-border-subtle/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all flex items-center justify-center',
                    viewMode === 'grid'
                      ? 'bg-primary-main text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main',
                  )}
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all flex items-center justify-center',
                    viewMode === 'list'
                      ? 'bg-primary-main text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main',
                  )}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MOBILE SECTION
      ══════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-4">

        {/* ── Single sticky banner: ALL BRANCHES + Pipeline title + Stage tabs ── */}
        <div className="sticky top-0 z-40 bg-bg-base border-b border-border-subtle/30 shadow-sm -mx-4 px-4 pb-2 -mt-1">
          {/* Row 1: Branch label (set from Dashboard) */}
          <div className="h-[40px] flex items-center">
            <span className="text-text-main font-black uppercase tracking-wide text-[16px]">
              {localStorage.getItem('admin_selected_branch_name') || 'ALL BRANCHES'}
            </span>
          </div>
          {/* Row 2: Acquisition Pipeline card */}
          <div className="bg-surface-card rounded-[16px] px-4 py-3 shadow-sm border border-border-subtle/30 flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-[#1976d2] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black tracking-tight text-text-main">
                Acquisition Pipeline
              </p>
              <p className="text-[10px] text-text-muted font-medium truncate">
                Vehicle sourcing and trade-in management across all stages
              </p>
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
          {/* Row 3: Stage tabs */}
          <div className="border-b border-border-subtle/30 pb-2">
            <StageTabBar
              columns={columns}
              activeTab={activeTab}
              onSelect={setActiveTab}
              getTitle={getTranslatedTitle}
            />
          </div>
        </div>

        {/* Mobile KPI cards */}
        <PipelineKpis columns={columns} totalLeads={totalLeads} loading={false} />

        {/* Mobile lead cards (active stage, always 2-col grid) */}
        {visibleColumns.map((column) => (
          <LeadGrid
            key={column.id}
            column={column}
            viewMode="grid"
            getTitle={getTranslatedTitle}
            onSelect={setSelectedLead}
            loading={false}
          />
        ))}
      </div>

      {/* ─── DESKTOP KANBAN ─── */}
      <DesktopKanban
        visibleColumns={visibleColumns}
        viewMode={viewMode}
        getTitle={getTranslatedTitle}
        onSelect={setSelectedLead}
        activeTab={activeTab}
      />


      {/* ─── DOSSIER MODAL ─── */}
      <AcquisitionDossierModal
        selectedLead={selectedLead}
        onClose={() => setSelectedLead(null)}
        branchStaff={branchStaff}
        onAssignStaff={assignStaff}
        onPrint={() => setPrintReportOpen(true)}
        onViewReport={() => setViewReportOpen(true)}
        onUpdateStatus={updateStatus}
        onRefresh={() => fetchLeads(true)}
        isSubmitting={isSubmitting}
      />

      {/* ─── PRINT DOCUMENT VIEWER ─── */}
      {selectedLead && (
        <DocumentViewer
          isOpen={printReportOpen}
          onClose={() => setPrintReportOpen(false)}
          title={`Evaluation Report - ${selectedLead.vehicle}`}
        >
          <EvaluationReport
            vehicle={{
              make: selectedLead.vehicle?.split(' ')?.[0] || 'Unknown',
              model: selectedLead.vehicle?.split(' ')?.slice(1).join(' ') || 'Unknown',
              year:
                selectedLead.vehicleDetails?.year ||
                selectedLead.vehicle?.match(/\d{4}/)?.[0] ||
                'N/A',
              mileage: Number(selectedLead.vehicleDetails?.mileage) || 0,
              condition: selectedLead.inspections?.[0]
                ? (() => {
                    const ins = selectedLead.inspections[0];
                    const avg =
                      ((ins.mechanical_score || 0) +
                        (ins.exterior_score || 0) +
                        (ins.interior_score || 0)) /
                      3;
                    return avg >= 80 ? 'A' : avg >= 60 ? 'B+' : avg >= 40 ? 'C' : 'D';
                  })()
                : 'Pending',
              price: selectedLead.askingPrice,
              plate_number: selectedLead.plate,
              id: selectedLead.id,
              inspection: selectedLead.inspections?.[0],
              photos: selectedLead.photos,
              fuel_type: selectedLead.vehicleDetails?.fuel_type,
              transmission: selectedLead.vehicleDetails?.transmission,
              customer: selectedLead.customer,
              phone: selectedLead.phone,
              location: selectedLead.location,
            }}
            date={new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </DocumentViewer>
      )}

      {/* ─── INSPECTION REPORT VIEW ─── */}
      <InspectionReportView
        lead={selectedLead}
        isOpen={viewReportOpen}
        onClose={() => setViewReportOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestClarification={handleClarification}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Acquisitions;
