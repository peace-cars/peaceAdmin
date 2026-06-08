import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Search, Car, User, Clock, Building2, CheckCircle2, 
  Zap, DollarSign, ChevronDown, ChevronUp, Phone,
  ArrowRight, UserCheck, AlertTriangle, RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SourcingRequest {
  id: string;
  make: string;
  model: string;
  min_year: number;
  max_year: number;
  max_budget: number;
  urgency: string;
  status: string;
  created_at: string;
  fuel_type?: string;
  transmission?: string;
  max_mileage?: number;
  payment_method?: string;
  must_have_features?: string[];
  exterior_colors?: string[];
  photos?: string[];
  contact_name?: string;
  contact_phone?: string;
  customer?: { id: string; full_name: string; phone_number: string };
  assigned_staff?: { id: string; full_name: string } | null;
  branch?: { id: string; name: string } | null;
}

const URGENCY_CONFIG: Record<string, { color: string; bg: string }> = {
  FLEXIBLE: { color: 'text-text-muted',  bg: 'bg-border-subtle/30' },
  MODERATE: { color: 'text-warning',     bg: 'bg-warning/10' },
  URGENT:   { color: 'text-error',       bg: 'bg-error/10' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'primary' | 'warning' | 'success' | 'error' | 'info' }> = {
  SUBMITTED:  { label: 'New',        variant: 'warning' },
  ASSIGNED:   { label: 'Assigned',   variant: 'primary' },
  SEARCHING:  { label: 'Searching',  variant: 'info' },
  MATCH_SENT: { label: 'Match Sent', variant: 'success' },
  READY:      { label: 'Closed',     variant: 'success' },
  CANCELLED:  { label: 'Cancelled',  variant: 'error' },
};

function RequestCard({
  req,
  staffList,
  branches,
  currentUserRole,
  onAssignStaff,
  onAssignBranch,
}: {
  req: SourcingRequest;
  staffList: any[];
  branches: any[];
  currentUserRole: string;
  onAssignStaff: (reqId: string, staffId: string) => void;
  onAssignBranch: (reqId: string, branchId: string) => void;
}) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const urgency = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.FLEXIBLE;
  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.SUBMITTED;
  const staffOnly = staffList.filter(s => s.role === 'STAFF');

  const isGM = currentUserRole === 'GENERAL_MANAGER';
  const needsBranch = isGM && !req.branch?.id;
  const needsStaff = !req.assigned_staff?.id && (req.branch?.id || !isGM);
  const isActive = !!req.assigned_staff?.id;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden transition-all shadow-sm flex flex-col hover:border-border-subtle/80">
      <div className="p-3 md:p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Left: Icon & Core Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border-subtle/50 flex items-center justify-center shrink-0">
            <Car size={20} className="text-text-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-[14px] text-text-main truncate">{req.make} {req.model}</p>
              <Badge variant={status.variant} className="text-[9px] h-4 px-1.5">{status.label}</Badge>
            </div>
            <p className="text-[12px] text-text-muted truncate font-medium">
              {req.min_year}–{req.max_year} • {req.fuel_type || 'Any'} • <span className="text-success font-bold">{Number(req.max_budget).toLocaleString()} ETB</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <span className={cn('font-bold px-1.5 py-0.5 rounded-md', urgency.bg, urgency.color)}>
                ⚡ {req.urgency}
              </span>
              <span className="text-text-muted/60 flex items-center gap-1">
                <User size={10} /> {req.customer?.full_name || req.contact_name || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions / Assignment */}
        <div className="shrink-0 w-full md:w-auto flex flex-col gap-2 items-stretch md:items-end border-t md:border-t-0 border-border-subtle/30 pt-3 md:pt-0">
          {!isActive ? (
            <div className="flex flex-col gap-2 w-full md:w-48">
              {needsBranch && branches.length > 0 && (
                <div className="flex items-center gap-1.5 bg-bg-secondary p-1 rounded-lg border border-border-subtle/50">
                  <select
                    className="flex-1 min-w-0 bg-transparent text-[11px] font-bold px-2 py-1 outline-none text-text-main"
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                  >
                    <option value="">Branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name || b.code}</option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedBranch}
                    onClick={() => { onAssignBranch(req.id, selectedBranch); setSelectedBranch(''); }}
                    className="bg-primary-main text-white w-6 h-6 rounded flex items-center justify-center disabled:opacity-50"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
              {needsStaff && staffOnly.length > 0 && (
                <div className="flex items-center gap-1.5 bg-bg-secondary p-1 rounded-lg border border-border-subtle/50">
                  <select
                    className="flex-1 min-w-0 bg-transparent text-[11px] font-bold px-2 py-1 outline-none text-text-main"
                    value={selectedStaff}
                    onChange={e => setSelectedStaff(e.target.value)}
                  >
                    <option value="">Staff...</option>
                    {staffOnly.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedStaff}
                    onClick={() => { onAssignStaff(req.id, selectedStaff); setSelectedStaff(''); }}
                    className="bg-primary-main text-white w-6 h-6 rounded flex items-center justify-center disabled:opacity-50"
                  >
                    <UserCheck size={12} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between md:justify-end gap-2 text-[11px] bg-success/5 rounded-lg px-2.5 py-1.5 border border-success/20 w-full md:w-auto">
              <span className="text-success font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> {req.assigned_staff?.full_name}
              </span>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-bold text-text-muted hover:text-text-main transition-colors uppercase tracking-widest mt-1 text-center md:text-right w-full"
          >
            {expanded ? 'Collapse' : 'Details'}
          </button>
        </div>
      </div>

      {/* Expanded spec */}
      {expanded && (
        <div className="border-t border-border-subtle/40 bg-bg-secondary/50 p-4 space-y-3 text-[13px]">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {req.max_mileage && <div className="flex justify-between col-span-2"><span className="text-text-muted">Max Mileage</span><span className="font-bold">{Number(req.max_mileage).toLocaleString()} km</span></div>}
            {req.payment_method && <div className="flex justify-between col-span-2"><span className="text-text-muted">Payment</span><span className="font-bold">{req.payment_method}</span></div>}
            <div className="flex justify-between col-span-2">
              <span className="text-text-muted">Submitted</span>
              <span className="font-bold">{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          {req.must_have_features && req.must_have_features.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Must-Have Features</p>
              <div className="flex flex-wrap gap-1.5">
                {req.must_have_features.map(f => (
                  <span key={f} className="text-[11px] font-semibold bg-primary-main/10 text-primary-main rounded-lg px-2 py-0.5 border border-primary-main/20">{f}</span>
                ))}
              </div>
            </div>
          )}
          {req.exterior_colors && req.exterior_colors.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Preferred Colors</p>
              <div className="flex flex-wrap gap-1.5">
                {req.exterior_colors.map(c => (
                  <span key={c} className="text-[11px] font-semibold bg-bg-base text-text-secondary rounded-lg px-2 py-0.5 border border-border-subtle">{c}</span>
                ))}
              </div>
            </div>
          )}
          {req.photos && req.photos.length > 0 && (
            <div className="col-span-2 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Attached Photos</p>
              <div className="flex flex-wrap gap-2">
                {req.photos.map((p, idx) => (
                  <a key={idx} href={p} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-xl overflow-hidden border border-border-subtle shadow-sm hover:opacity-80 transition-opacity">
                    <img src={p} alt={`Customer attachment ${idx+1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminSourcingView({
  requests,
  staffList,
  branches,
  onAssignStaff,
  onAssignBranch,
  currentUserRole,
}: {
  requests: SourcingRequest[];
  staffList: any[];
  branches: any[];
  onAssignStaff: (reqId: string, staffId: string) => void;
  onAssignBranch: (reqId: string, branchId: string) => void;
  currentUserRole: string;
}) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');

  const needsAction = requests.filter(r => !r.assigned_staff?.id);
  const active = requests.filter(r => !!r.assigned_staff?.id);

  const displayed =
    filter === 'PENDING' ? needsAction :
    filter === 'ACTIVE'  ? active :
    requests;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-main/10 border border-primary-main/20 flex items-center justify-center">
            <Search size={16} className="text-primary-main" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-text-main">Custom Sourcing Pipeline</h2>
            <p className="text-[12px] text-text-muted">{requests.length} total • {needsAction.length} need action</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-bg-secondary border border-border-subtle/40 p-1 rounded-xl w-fit gap-1 overflow-x-auto no-scrollbar max-w-full">
        {(['ALL', 'PENDING', 'ACTIVE'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap',
              filter === tab
                ? 'bg-surface-card text-primary-main shadow-sm'
                : 'text-text-muted hover:text-text-main'
            )}
          >
            {tab === 'ALL' ? `All (${requests.length})` :
             tab === 'PENDING' ? `Needs Action (${needsAction.length})` :
             `Active (${active.length})`}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-border-subtle rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center">
            <Search size={24} className="text-text-muted/40" />
          </div>
          <div className="text-center">
            <p className="text-text-main font-bold">No requests found</p>
            <p className="text-text-muted text-[13px] mt-1">
              {filter === 'PENDING' ? 'All requests have been assigned!' :
               filter === 'ACTIVE' ? 'No active sourcing hunts yet' :
               'No sourcing requests yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayed.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              staffList={staffList}
              branches={branches}
              currentUserRole={currentUserRole}
              onAssignStaff={onAssignStaff}
              onAssignBranch={onAssignBranch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
