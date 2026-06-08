import React from 'react';
import { Car, Clock, MapPin, Activity, User, Heart } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ProgressiveImage } from '../ui/ProgressiveImage';
import { cn } from '../../lib/utils';

interface InspectionReportsPageProps {
  tradeIns: any[];
  onSelectReport: (lead: any) => void;
  statusFilter?: string;
  searchFilter?: string;
}

export const InspectionReportsPage: React.FC<InspectionReportsPageProps> = ({
  tradeIns,
  onSelectReport,
  statusFilter = 'all',
  searchFilter = '',
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'MANAGER_REVIEW':
        return { label: 'PENDING', style: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
      case 'OFFER_MADE':
        return { label: 'APPROVED', style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
      case 'REJECTED':
        return { label: 'REJECTED', style: 'bg-rose-500/15 text-rose-400 border-rose-500/20' };
      default:
        return { label: status.replace(/_/g, ' '), style: 'bg-bg-secondary text-text-muted border-border-subtle/30' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tradeIns.map((lead) => {
          const latestIns = lead.inspections?.[0];
          const healthScore = latestIns
            ? Math.round(
                ((latestIns.mechanical_score || 0) +
                  (latestIns.exterior_score || 0) +
                  (latestIns.interior_score || 0)) /
                  3,
              )
            : 0;
          const statusConfig = getStatusConfig(lead.status);

          return (
            <div
              key={lead.id}
              onClick={() => onSelectReport(lead)}
              className="flex flex-col bg-surface-card rounded-[16px] overflow-hidden border border-border-subtle/30 shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/3] bg-bg-secondary">
                {lead.photos && lead.photos.length > 0 ? (
                  <ProgressiveImage
                    src={lead.photos[0]}
                    alt={lead.vehicle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={20} className="text-text-muted opacity-30" />
                  </div>
                )}

                {/* Status badge top-left */}
                <div
                  className={cn(
                    'absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[8px] font-bold shadow-sm uppercase border',
                    statusConfig.style,
                  )}
                >
                  {statusConfig.label}
                </div>

                {/* Heart top-right */}
                <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm">
                  <Heart size={12} className="text-white" />
                </div>
              </div>

              {/* Details */}
              <div className="p-2.5 flex flex-col gap-1">
                <h4 className="text-[11px] font-bold text-text-main leading-tight truncate">
                  {lead.vehicle}
                </h4>
                <p className="text-[9px] text-text-muted font-medium truncate flex items-center gap-1">
                  <User size={8} /> {lead.customer}
                </p>
                <div className="flex items-center justify-between mt-1 border-t border-border-subtle/30 pt-1">
                  {latestIns ? (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[11px] font-black',
                        healthScore >= 80
                          ? 'text-success-main'
                          : healthScore >= 60
                            ? 'text-warning'
                            : 'text-error-main',
                      )}
                    >
                      <Activity size={10} />
                      {healthScore}% Score
                    </span>
                  ) : (
                    <span className="text-[9px] text-text-muted italic">No inspection</span>
                  )}
                </div>
                {/* Location pill */}
                <span className="self-start rounded-full px-2 py-0.5 text-[8px] font-bold border mt-0.5 text-text-muted border-border-subtle/30 bg-bg-secondary flex items-center gap-1">
                  <MapPin size={8} /> {lead.location || 'Central'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {tradeIns.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-surface-card rounded-2xl border border-dashed border-border-subtle">
          <Car size={40} className="text-text-muted/30 mb-3" />
          <h3 className="text-[15px] font-bold text-text-main">No Reports Found</h3>
          <p className="text-[13px] text-text-muted mt-1">
            There are no inspection reports matching your filters.
          </p>
        </div>
      )}
    </div>
  );
};
