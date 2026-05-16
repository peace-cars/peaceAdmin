import React from 'react';
import { Activity, User, ChevronRight, CarFront, MapPin, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface InspectionReportsPageProps {
  tradeIns: any[];
  onSelectReport: (lead: any) => void;
  statusFilter?: string;
  searchFilter?: string;
}

export const InspectionReportsPage: React.FC<InspectionReportsPageProps> = ({ tradeIns, onSelectReport, statusFilter = 'all', searchFilter = '' }) => {
  // Filter to reviewable statuses
  const reviewable = tradeIns.filter(t => 
    ['MANAGER_REVIEW', 'OFFER_MADE', 'REJECTED'].includes(t.status)
  );

  // Apply filters
  const reviews = reviewable.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = searchFilter === '' || 
      (t.vehicle || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (t.customer || '').toLowerCase().includes(searchFilter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'MANAGER_REVIEW': return { label: 'Pending Review', color: 'bg-warning/80', badge: 'warning' as const };
      case 'OFFER_MADE': return { label: 'Approved', color: 'bg-success/80', badge: 'success' as const };
      case 'REJECTED': return { label: 'Rejected', color: 'bg-error-main/80', badge: 'error' as const };
      default: return { label: status.replace(/_/g, ' '), color: 'bg-bg-secondary/80', badge: 'default' as const };
    }
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-5">
          {reviews.map(lead => {
             const latestIns = lead.inspections?.[0];
             const healthScore = latestIns ? Math.round(((latestIns.mechanical_score || 0) + (latestIns.exterior_score || 0) + (latestIns.interior_score || 0)) / 3) : 0;
             const syncDate = latestIns?.created_at ? new Date(latestIns.created_at) : null;
             const isDateValid = syncDate && !isNaN(syncDate.getTime());
             const statusConfig = getStatusConfig(lead.status);
             
             return (
               <div 
                 key={lead.id}
                 onClick={() => onSelectReport(lead)}
                 className="bg-surface-card border border-border-subtle/40 rounded-2xl overflow-hidden hover:border-primary-main/30 hover:shadow-xl transition-all cursor-pointer group flex flex-col"
               >
                  {/* Thumbnail Header */}
                  <div className="h-28 md:h-40 relative bg-bg-secondary overflow-hidden">
                     {lead.photos && lead.photos.length > 0 ? (
                       <img src={lead.photos[0]} alt={lead.vehicle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center">
                         <CarFront size={28} className="text-text-muted opacity-10" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                     
                     {/* Health Score Badge */}
                     <div className="absolute top-2 right-2 md:top-3 md:right-3">
                       <div className={cn(
                         "w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center font-bold bg-bg-secondary/20 border border-white/20 shadow-lg text-white",
                         healthScore > 70 ? "bg-success/80" : 
                         healthScore > 40 ? "bg-warning/80" : 
                         "bg-error-main/80"
                       )}>
                          <span className="text-[6px] md:text-[7px] font-medium leading-none mb-0.5">Health</span>
                          <span className="text-sm md:text-base font-bold tracking-tighter">{healthScore}%</span>
                       </div>
                     </div>

                     {/* Status Badge */}
                     <div className="absolute top-2 left-2 md:top-3 md:left-3">
                       <Badge variant={statusConfig.badge} className="text-[9px] md:text-[11px] h-5 md:h-6 px-1.5 md:px-2 shadow-sm border-white/20">
                         {statusConfig.label}
                       </Badge>
                     </div>

                     <div className="absolute bottom-2 left-2 md:bottom-3 md:left-4">
                       <p className="text-[10px] md:text-[13px] font-mono text-white/80 font-bold tracking-widest">REF: {lead.id.substring(0,6).toUpperCase()}</p>
                     </div>
                  </div>

                  <div className="p-3 md:p-5 space-y-3 md:space-y-4 flex-1 flex flex-col">
                     <div className="space-y-1 md:space-y-1.5">
                        <h3 className="text-[13px] md:text-sm font-bold text-text-main group-hover:text-primary-main transition-colors tracking-tight leading-tight truncate">{lead.vehicle || lead.car}</h3>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-[10px] md:text-[12px] font-bold text-text-muted font-medium">
                           <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                              <User size={10} className="shrink-0" />
                              {latestIns?.profiles?.full_name || 'Staff Technician'}
                           </span>
                           <span className="hidden md:inline w-1 h-1 bg-border-subtle rounded-full shrink-0" />
                           <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                              <MapPin size={10} className="shrink-0" /> {lead.location || 'Local'}
                           </span>
                        </div>
                     </div>

                     <div className="flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-4 pt-2 md:pt-3 border-t border-border-subtle/30">
                        <div>
                           <p className="text-[9px] md:text-[11px] font-bold text-text-muted font-medium">Asking Price</p>
                           <p className="text-[13px] md:text-base font-bold text-text-main tracking-tight">
                              {(lead.askingPrice || lead.user_asking_price_etb || 0).toLocaleString()} <span className="text-[10px] md:text-[12px] text-primary-main">ETB</span>
                           </p>
                        </div>
                        <div>
                           <p className="text-[9px] md:text-[11px] font-bold text-text-muted font-medium">Evaluated</p>
                           <p className="text-[11px] md:text-[13px] font-bold text-text-main flex items-center gap-1.5">
                              <Clock size={10} className="text-text-muted/50 shrink-0" /> 
                              {isDateValid ? syncDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pending'}
                           </p>
                        </div>
                     </div>

                     {/* Inspector Notes Preview */}
                     {latestIns?.final_notes && (
                       <div className="bg-bg-secondary/50 p-2 md:p-3 rounded-xl border border-border-subtle/20 mt-auto">
                          <p className="text-[11px] md:text-[13px] text-text-secondary font-medium italic line-clamp-2 leading-relaxed">
                             "{latestIns.final_notes}"
                          </p>
                       </div>
                     )}
                  </div>
                  
                  <div className="px-3 md:px-5 py-2.5 md:py-3.5 bg-bg-secondary/30 border-t border-border-subtle/20 flex items-center justify-between group-hover:bg-primary-main transition-colors">
                     <span className="text-[10px] md:text-[12px] font-bold text-text-muted group-hover:text-bg font-medium">Full Dossier</span>
                     <ChevronRight size={14} className="text-text-muted group-hover:text-bg group-hover:translate-x-1 transition-all md:w-4 md:h-4 w-3 h-3" />
                  </div>
               </div>
             );
          })}
          
          {reviews.length === 0 && (
             <div className="col-span-full py-20 text-center border border-dashed border-border-subtle/50 rounded-2xl bg-bg-secondary/50 flex flex-col items-center justify-center gap-4">
                <Activity size={28} className="text-text-muted/20" />
                <div className="space-y-1">
                   <p className="text-[13px] font-bold text-text-muted font-medium opacity-40">No reports match your filters</p>
                   <p className="text-[12px] text-text-muted/60 font-medium">Adjust search or filter criteria</p>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};
