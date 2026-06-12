import React from 'react';
import { Activity, CarFront, User, ChevronRight, MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { SkeletonCard, SkeletonRow } from '../ui/Skeleton';

interface DistrictManagerViewProps {
  tradeIns: any[];
  showroomCount: number;
  budgets: any[];
  branchStaff: any[];
  dmBranches?: any[];
  activeQueueTab: string;
  role?: string;
  loadingMetrics?: boolean;
  selectedBranchId?: string;
  onAssignTask: (tradeInId: string, staffId: string) => void;
  onApprove: (tradeInId: string, offerPrice: number) => void;
  onReject: (tradeInId: string, reason: string) => void;
  onViewReport: (lead: any) => void;
  onEscalate: (tradeInId: string) => void;
  isSubmitting?: boolean;
}

export const DistrictManagerView: React.FC<DistrictManagerViewProps> = ({
  tradeIns,
  showroomCount,
  budgets,
  branchStaff,
  dmBranches = [],
  activeQueueTab,
  role,
  loadingMetrics,
  selectedBranchId = 'ALL',
  onAssignTask,
  onApprove,
  onReject,
  onViewReport,
  onEscalate,
  isSubmitting
}) => {
  const [activeTab, setActiveTab] = React.useState('Authorization Pending');

  if (loadingMetrics) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-1/4 bg-border-subtle/30 animate-pulse rounded" />
          <div className="h-4 w-1/3 bg-border-subtle/30 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-2 pt-4">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'Authorization Pending', label: 'Pending', filter: (item: any) => item.status === 'NEW_LEAD' || item.status === 'MANAGER_REVIEW' || item.status === 'INSPECTION_PENDING' },
    { id: 'Asset Negotiation', label: 'Negotiation', filter: (item: any) => item.status === 'NEGOTIATION' || item.status === 'OFFER_MADE' },
    { id: 'Validated Leads', label: 'Settled', filter: (item: any) => item.status === 'APPROVED' || item.status === 'FUNDED' || item.status === 'ACCEPTED' || item.status === 'REJECTED' },
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
  
  let currentLeads = tradeIns;
  if (selectedBranchId !== 'ALL') {
    currentLeads = tradeIns.filter(t => t.branch_id === selectedBranchId || t.locationId === selectedBranchId);
  }
  const filteredItems = currentLeads.filter(currentTab.filter);

  const assignableStaff = branchStaff.filter(s => 
    s.role === 'STAFF' && 
    (selectedBranchId === 'ALL' || s.locationId === selectedBranchId || s.branch_id === selectedBranchId)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-text-main">Leads Pipeline</h2>
          <p className="text-[13px] text-text-muted">Track incoming vehicle acquisitions</p>
        </div>
        
        {/* The branch filter is now driven by the parent Dashboard dropdown — no duplicate UI needed */}
      </div>

      {/* Tabs */}
      <div className="bg-surface-card border border-border-subtle/30 rounded-xl p-1 flex gap-0.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const count = currentLeads.filter(tab.filter).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap px-4 md:flex-1 py-2.5 text-[13px] font-medium rounded-lg transition-all flex items-center justify-center gap-2 shrink-0",
                activeTab === tab.id 
                  ? "bg-text-main text-bg" 
                  : "text-text-muted hover:text-text-main hover:bg-bg-secondary"
              )}
            >
              {tab.label}
              <span className={cn(
                "min-w-[22px] h-5 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center",
                activeTab === tab.id ? "bg-bg-secondary/20 text-bg" : "bg-bg-secondary text-text-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border-subtle/30 rounded-2xl bg-surface-card flex flex-col items-center gap-3">
          <Activity size={24} className="text-text-muted opacity-20" />
          <p className="text-[14px] text-text-muted">No leads in this category</p>
          <p className="text-[13px] text-text-muted/40">Assets appear here as they enter the pipeline</p>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal list */}
          <div className="flex flex-col gap-2 md:hidden">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-surface-card border border-border-subtle/30 rounded-2xl overflow-hidden  transition-all flex flex-row"
              >
                {/* Thumbnail — square left panel */}
                <div
                  className="w-24 shrink-0 relative bg-bg-secondary overflow-hidden cursor-pointer"
                  onClick={() => onViewReport(item)}
                >
                  {item.photos && item.photos.length > 0 ? (
                    <img src={item.photos[0]} alt={item.vehicle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CarFront size={22} className="text-text-muted opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide",
                      item.status === 'NEW_LEAD' ? 'bg-warning/20 text-warning' :
                      item.status === 'MANAGER_REVIEW' ? 'bg-primary-main/20 text-primary-main' :
                      item.status === 'OFFER_MADE' ? 'bg-success/20 text-success' :
                      item.status === 'REJECTED' ? 'bg-error-main/20 text-error-main' :
                      'bg-border-subtle/20 text-text-muted'
                    )}>
                      {item.status === 'NEW_LEAD' ? 'New' :
                       item.status === 'MANAGER_REVIEW' ? 'Review' :
                       item.status === 'INSPECTION_PENDING' ? 'Inspect' :
                       item.status === 'OFFER_MADE' ? 'Offered' :
                       item.status === 'REJECTED' ? 'Rejected' : 
                       item.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Content — right panel */}
                <div className="flex-1 min-w-0 p-3 flex flex-col gap-1.5">
                  <div onClick={() => onViewReport(item)} className="cursor-pointer">
                    <h4 className="text-[13px] font-semibold text-text-main truncate leading-tight">{item.vehicle || 'Unidentified Asset'}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-text-muted truncate">
                        <User size={10} className="shrink-0" /> {item.customer || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-text-muted truncate">
                      <MapPin size={10} className="shrink-0" /> {item.location || 'Local'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border-subtle/20">
                    <p className="text-[13px] font-bold text-text-main">
                      {(item.askingPrice || item.user_asking_price_etb || 0).toLocaleString()}
                      <span className="text-[10px] text-primary-main ml-1">ETB</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      {item.phone && (
                        <a href={`tel:${item.phone}`}
                          className="w-7 h-7 rounded-lg bg-bg-secondary flex items-center justify-center text-text-muted active:scale-95 transition-all"
                          onClick={e => e.stopPropagation()}>
                          <Phone size={12} />
                        </a>
                      )}
                      {item.status === 'NEW_LEAD' && (
                        <div onClick={e => e.stopPropagation()} className="flex-1">
                          <select
                            className="bg-primary-main/10 text-primary-main text-[11px] font-semibold h-7 px-2 rounded-lg outline-none appearance-none cursor-pointer disabled:opacity-50"
                            onChange={(e) => onAssignTask(item.id, e.target.value)}
                            defaultValue=""
                            disabled={isSubmitting}
                          >
                            <option value="" disabled>Assign</option>
                            {assignableStaff.map(s => <option key={s.id} value={s.id}>{s.full_name || s.fullName}</option>)}
                          </select>
                        </div>
                      )}
                      {item.status === 'MANAGER_REVIEW' && (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            className="text-[11px] font-semibold px-2.5 h-7 bg-primary-main text-white rounded-lg active:scale-95 transition-all disabled:opacity-50"
                            disabled={isSubmitting}
                            onClick={() => {
                              const price = prompt('Final Dealer Offer (ETB):', item.user_asking_price_etb || item.askingPrice || 0);
                              if (price) onApprove(item.id, Number(price));
                            }}
                          >Approve</button>
                          <button
                            className="text-[11px] font-semibold px-2.5 h-7 bg-error-main/10 text-error-main rounded-lg active:scale-95 transition-all disabled:opacity-50"
                            disabled={isSubmitting}
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) onReject(item.id, reason);
                            }}
                          >Reject</button>
                        </div>
                      )}
                      {item.status === 'INSPECTION_PENDING' && (
                        <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-1 rounded-lg">Evaluating</span>
                      )}
                      {item.status === 'OFFER_MADE' && (
                        <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-1 rounded-lg">Offered</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet+: vertical card grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-surface-card border border-border-subtle/30 rounded-2xl overflow-hidden  transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div
                  className="h-40 relative bg-bg-secondary overflow-hidden cursor-pointer"
                  onClick={() => onViewReport(item)}
                >
                  {item.photos && item.photos.length > 0 ? (
                    <img src={item.photos[0]} alt={item.vehicle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CarFront size={32} className="text-text-muted opacity-15" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={
                        item.status === 'NEW_LEAD' ? 'warning' :
                        item.status === 'MANAGER_REVIEW' ? 'primary' :
                        item.status === 'OFFER_MADE' ? 'success' :
                        item.status === 'REJECTED' ? 'error' : 'default'
                      }
                    >
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <div onClick={() => onViewReport(item)} className="cursor-pointer">
                    <h4 className="text-[15px] font-semibold text-text-main truncate">{item.vehicle || 'Unidentified Asset'}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[13px] text-text-muted">
                      <span className="flex items-center gap-1 truncate"><User size={12} className="shrink-0" /> {item.customer}</span>
                      <span className="text-text-dim">·</span>
                      <span className="flex items-center gap-1 truncate"><MapPin size={12} className="shrink-0" /> {item.location || 'Local'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle/30">
                    <div>
                      <p className="text-[12px] text-text-muted">Asking Price</p>
                      <p className="text-[16px] font-bold text-text-main">
                        {(item.askingPrice || item.user_asking_price_etb || 0).toLocaleString()} <span className="text-[12px] text-primary-main">ETB</span>
                      </p>
                    </div>
                    {item.phone && (
                      <a href={`tel:${item.phone}`} className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-muted hover:text-primary-main transition-all active:scale-95" onClick={e => e.stopPropagation()}>
                        <Phone size={16} />
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-3 space-y-2">
                    {item.status === 'NEW_LEAD' && (
                      <div onClick={e => e.stopPropagation()}>
                        <select
                          className="w-full bg-bg-secondary border border-border-subtle/30 text-[14px] h-11 px-4 rounded-xl text-text-main outline-none focus:border-primary-main/30 appearance-none cursor-pointer disabled:opacity-50"
                          onChange={(e) => onAssignTask(item.id, e.target.value)}
                          defaultValue=""
                          disabled={isSubmitting}
                        >
                          <option value="" disabled>Assign staff...</option>
                          {assignableStaff.map(s => <option key={s.id} value={s.id}>{s.full_name || s.fullName}</option>)}
                        </select>
                      </div>
                    )}
                    {item.status === 'MANAGER_REVIEW' && (
                      <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                        <Button variant="primary" className="w-full" disabled={isSubmitting} loading={isSubmitting}
                          onClick={() => {
                            const price = prompt('Final Dealer Offer (ETB):', item.user_asking_price_etb || item.askingPrice || 0);
                            if (price) onApprove(item.id, Number(price));
                          }}>
                          Approve & Offer
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1 border-warning/30 text-warning hover:bg-warning/10" disabled={isSubmitting} loading={isSubmitting} onClick={() => onEscalate(item.id)}>Escalate</Button>
                          <Button variant="outline" size="sm" className="flex-1 border-error-main/30 text-error-main hover:bg-error-main/10" disabled={isSubmitting} loading={isSubmitting}
                            onClick={() => { const reason = prompt('Reason for rejection:'); if (reason) onReject(item.id, reason); }}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                    {item.status === 'INSPECTION_PENDING' && (
                      <div className="flex items-center gap-2 py-2.5 px-3 bg-warning/10 border border-warning/20 rounded-xl">
                        <Clock size={14} className="text-warning shrink-0" />
                        <p className="text-[13px] font-medium text-warning/80">Awaiting evaluation</p>
                      </div>
                    )}
                    {item.status === 'OFFER_MADE' && (
                      <div className="flex items-center gap-2 py-2.5 px-3 bg-success/10 border border-success/20 rounded-xl">
                        <Activity size={14} className="text-success shrink-0" />
                        <p className="text-[13px] font-medium text-success/80">Offer sent to client</p>
                      </div>
                    )}
                    {item.status === 'REJECTED' && (
                      <div className="flex items-center gap-2 py-2.5 px-3 bg-error-main/10 border border-error-main/20 rounded-xl">
                        <Activity size={14} className="text-error-main shrink-0" />
                        <p className="text-[13px] font-medium text-error-main/80">Lead rejected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
