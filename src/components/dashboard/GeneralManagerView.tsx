import React from 'react';
import { LineChart, Wallet, Building2, Calculator, Shield, User, CarFront, Users, MapPin, Map, Database, CheckCircle2 } from 'lucide-react';
import { KpiTile } from '../ui/KpiTile';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface GeneralManagerViewProps {
  loadingMetrics: boolean;
  totalNetProfit: number;
  pendingCommissions: number;
  branchCount: number;
  exchangeRate: string;
  tradeIns: any[];
  districtOverview?: any[];
  onUpdateExchangeRate: () => void;
  onApproveListing: (id: string, price: number) => void;
  onApprove: (id: string, price: number) => void;
  onReject: (id: string, reason: string) => void;
}

export const GeneralManagerView: React.FC<GeneralManagerViewProps> = ({
  loadingMetrics,
  totalNetProfit,
  pendingCommissions,
  branchCount,
  exchangeRate,
  tradeIns,
  districtOverview = [],
  onUpdateExchangeRate,
  onApproveListing,
  onApprove,
  onReject
}) => {
  const escalatedLeads = tradeIns.filter(t => t.status === 'ESCALATED_TO_GM' || t.status === 'MANAGER_REVIEW');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile 
          label="Portfolio Revenue" 
          value={loadingMetrics ? '---' : `${(totalNetProfit / 1000000).toFixed(1)}M`}
          icon={<LineChart size={18} />}
          delta={12}
          deltaType="increase"
        />
        <KpiTile 
          label="Settlement Pending" 
          value={loadingMetrics ? '---' : `${(pendingCommissions / 1000).toFixed(1)}K`}
          icon={<Wallet size={18} />}
          color="amber"
        />
        <KpiTile 
          label="Active Hubs" 
          value={loadingMetrics ? '---' : branchCount}
          icon={<Building2 size={18} />}
          color="emerald"
        />
        {/* Exchange Rate Card */}
        <div className="bg-surface-card border border-border-subtle/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-text-muted">USD/ETB</span>
            <Calculator size={16} className="text-text-muted/40" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl font-bold text-text-main">{exchangeRate} <span className="text-[12px] text-primary-main ml-0.5">ETB</span></p>
            <button 
              onClick={onUpdateExchangeRate}
              className="text-[12px] font-medium bg-primary-main/10 text-primary-main px-3 py-1.5 rounded-lg hover:bg-primary-main/20 transition-all active:scale-95"
            >
              Update
            </button>
          </div>
        </div>
      </div>
      
      {/* District Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Map size={16} className="text-primary-main" />
            <h2 className="text-[15px] font-semibold text-text-main">National Overview</h2>
          </div>
          <Badge variant="primary">Live</Badge>
        </div>

        {districtOverview.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-border-subtle border-dashed py-12 text-center flex flex-col items-center gap-3">
            <Database className="text-text-muted opacity-20" size={28} />
            <p className="text-[14px] text-text-muted">Hierarchy data loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {districtOverview.map((district) => (
              <div key={district.district_id} className="bg-surface-card rounded-2xl border border-border-subtle/30 overflow-hidden hover:border-primary-main/30 transition-all">
                <div className="p-4 border-b border-border-subtle/30 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-primary-main" />
                      <h3 className="font-semibold text-text-main text-[15px]">{district.district_name}</h3>
                    </div>
                    <p className="text-[13px] text-text-muted flex items-center gap-1.5">
                      <Shield size={12} /> DM: {district.dm_name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-bg-secondary flex items-center justify-center text-[14px] font-bold text-text-main">
                    {district.total_branches}
                  </div>
                </div>
                
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[13px] text-text-muted">Staff</p>
                    <p className="text-lg font-bold text-text-main flex items-center gap-1.5">
                      {district.total_staff} <Users size={14} className="text-text-muted" />
                    </p>
                  </div>
                  <div>
                    <p className="text-[13px] text-text-muted">Vehicles</p>
                    <p className="text-lg font-bold text-text-main flex items-center gap-1.5">
                      {district.total_vehicles} <CarFront size={14} className="text-text-muted" />
                    </p>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-bg-secondary border-t border-border-subtle/30 flex justify-between items-center">
                  <span className="text-[13px] text-text-muted">Total Value</span>
                  <span className="text-[14px] font-semibold text-text-main">
                    {Number(district.total_value_etb).toLocaleString()} <span className="text-[12px] text-primary-main">ETB</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Escalated Pipeline */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Shield size={16} className="text-primary-main" />
          <h2 className="text-[15px] font-semibold text-text-main">Executive Authorization</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
          {escalatedLeads.length === 0 ? (
            <div className="col-span-full py-12 md:py-16 text-center border border-dashed border-border-subtle/50 rounded-2xl bg-surface-card flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} className="text-success" />
              </div>
              <div>
                <p className="text-[14px] md:text-[15px] font-semibold text-text-main">Pipeline Clear</p>
                <p className="text-[12px] md:text-[13px] text-text-muted/60 mt-0.5">No assets need executive authorization</p>
              </div>
            </div>
          ) : escalatedLeads.map(vehicle => (
             <div key={vehicle.id} className="bg-surface-card rounded-2xl border border-border-subtle/30 overflow-hidden flex flex-col hover:border-primary-main/30 transition-all">
              <div className="h-1 w-full bg-warning shrink-0" />
              
              {/* Thumbnail */}
              <div className="h-28 md:h-40 w-full relative overflow-hidden bg-bg-secondary shrink-0">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <img src={vehicle.photos[0]} alt={vehicle.vehicle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CarFront size={28} className="text-text-muted opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 right-2 md:top-3 md:right-3">
                  <Badge variant="warning" className="text-[9px] md:text-[11px] px-1.5 md:px-2 py-0.5">Escalated</Badge>
                </div>
              </div>

              <div className="flex flex-col flex-grow p-2 md:p-4 space-y-2 md:space-y-3">
                <div className="space-y-1">
                  <h3 className="text-[13px] md:text-[15px] font-semibold text-text-main truncate">{vehicle.vehicle || vehicle.car || vehicle.vehicleMakeModel}</h3>
                  <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-[13px] text-text-muted">
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <User size={11} className="md:w-3 md:h-3 shrink-0" /> {vehicle.customer}
                    </span>
                    <span className="text-text-dim">·</span>
                    <span className="text-text-dim font-mono">#{vehicle.id.substring(0,6).toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-3 border-t border-border-subtle/30 gap-2">
                  <div>
                    <p className="text-[10px] md:text-[12px] text-text-muted">Valuation</p>
                    <p className="text-[13px] md:text-[16px] font-bold text-text-main">
                      {(vehicle.price || vehicle.user_asking_price_etb || vehicle.askingPrice || 0).toLocaleString()} 
                      <span className="text-[10px] md:text-[12px] text-primary-main ml-1">ETB</span>
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-1 md:pt-2 space-y-1.5">
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const price = prompt('Final Approved Offer (ETB):', (vehicle.price || vehicle.user_asking_price_etb || vehicle.askingPrice || 0).toString());
                      if (price) onApprove(vehicle.id, Number(price));
                    }}
                    className="w-full h-8 md:h-10 text-[11px] md:text-[13px]"
                  >
                    Authorize Offer
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) onReject(vehicle.id, reason);
                    }}
                    className="w-full h-8 md:h-10 text-[11px] md:text-[13px] border-error-main/30 text-error-main hover:bg-error-main/10"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
