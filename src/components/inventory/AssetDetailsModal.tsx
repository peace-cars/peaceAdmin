import React, { useEffect } from 'react';
import { ChevronLeft, Edit2, Network, Building2, LayoutGrid, Car, Zap, Settings, Heart, ImageIcon, ExternalLink, FileText, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { getStatusStyle } from './VehicleCard';
import { DocumentPreviewButton } from '../ui/DocumentViewerModal';

interface AssetDetailsModalProps {
  isOpen: boolean;
  car: any;
  onClose: () => void;
  onEdit: () => void;
}

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({ isOpen, car, onClose, onEdit }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!car || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-base overflow-y-auto animate-fade-in flex flex-col">
       {/* FLOATING ACTION BUTTONS */}
       <div 
         className="absolute top-0 left-0 right-0 z-50 pointer-events-none flex items-start justify-between p-4 md:p-6"
         style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
       >
          <button 
            onClick={onClose} 
            className="pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-white/[0.08] text-text-main hover:text-primary-main transition-all active:scale-90"
          >
            <ChevronLeft size={24} className="-ml-0.5" /> 
          </button>
          
          <button 
            onClick={onEdit} 
            className="pointer-events-auto flex items-center gap-2 px-5 h-11 rounded-full bg-white/40 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-white/[0.08] text-text-main hover:text-primary-main font-bold text-sm transition-all active:scale-95"
          >
             <Edit2 size={16} /> Edit
          </button>
       </div>

       <div className="relative pb-24">
        
        {/* HERO SECTION */}
        <div className="relative h-72 md:h-96 flex items-end p-6 md:p-8 shrink-0">
          <div className="absolute inset-0 bg-bg-secondary">
            <img src={car.image} alt={car.model} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg-base/60 to-transparent" />
          </div>
          
          <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
               <div className="flex flex-wrap gap-2 mb-3">
                 <span className={cn("px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md border", getStatusStyle(car.status))}>
                   {car.status}
                 </span>
                 {car.duty && (
                   <span className={cn("px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md border", 
                     car.duty === 'DUTY PAID' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                   )}>
                     {car.duty}
                   </span>
                 )}
                 <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10">
                   {car.fuel}
                 </span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                 {car.make} <span className="text-primary-main">{car.model}</span>
               </h1>
               <p className="text-[14px] text-white/70 font-mono mt-2 flex items-center gap-2">
                 <Network size={14} /> VIN: {car.vin || car.id}
               </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3">
               <div className="text-left md:text-right">
                 <p className="text-[12px] text-white/70 uppercase tracking-[0.2em] font-bold mb-1">Registry Valuation</p>
                 <p className="text-3xl md:text-4xl font-black text-white drop-shadow-md">{car.priceFormatted}</p>
               </div>
               <button 
                 onClick={onEdit}
                 className="flex items-center gap-2 px-6 py-2.5 bg-primary-main hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(33,150,243,0.5)] hover:shadow-[0_0_25px_-5px_rgba(33,150,243,0.7)] active:scale-95"
               >
                  <Edit2 size={16} /> Edit Asset
               </button>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="relative z-20 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 px-4 md:px-8 mt-6 max-w-[1400px] mx-auto">
           
           {/* Main Column */}
           <div className="space-y-8">
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-surface-card border border-border-subtle/30 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-primary-main/10 flex items-center justify-center text-primary-main mb-1">
                    <Building2 size={16} />
                  </div>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold">Location</p>
                  <p className="text-[14px] font-bold text-text-main leading-tight truncate">{car.branchName || 'Unassigned'}</p>
                </div>
                <div className="bg-surface-card border border-border-subtle/30 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-1">
                    <LayoutGrid size={16} />
                  </div>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold">Plate</p>
                  <p className="text-[14px] font-bold text-text-main leading-tight truncate">{car.plate || 'Unregistered'}</p>
                </div>
                <div className="bg-surface-card border border-border-subtle/30 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success mb-1">
                    <Car size={16} />
                  </div>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold">Mileage</p>
                  <p className="text-[14px] font-bold text-text-main leading-tight truncate">{car.certifiedKm ? `${Number(car.certifiedKm).toLocaleString()} km` : 'N/A'}</p>
                </div>
                <div className="bg-surface-card border border-border-subtle/30 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-1">
                    <Zap size={16} />
                  </div>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold">Energy</p>
                  <p className="text-[14px] font-bold text-text-main leading-tight truncate">{car.fuel}</p>
                </div>
              </div>

              {/* Technical Specifications */}
              {car.specifications && Object.keys(car.specifications).length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                     <Settings size={20} className="text-primary-main" />
                     <h3 className="text-lg font-black text-text-main">Technical DNA</h3>
                  </div>
                  <div className="bg-surface-card border border-border-subtle/30 rounded-3xl p-1 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y divide-border-subtle/30 md:divide-y-0">
                      {car.specifications.batteryKwh && (
                        <div className="p-5 text-center">
                          <p className="text-[12px] text-text-muted uppercase tracking-wider font-bold mb-1">Battery</p>
                          <p className="text-[20px] font-black text-text-main">{car.specifications.batteryKwh} <span className="text-[14px] text-primary-main">kWh</span></p>
                        </div>
                      )}
                      {car.specifications.range && (
                        <div className="p-5 text-center">
                          <p className="text-[12px] text-text-muted uppercase tracking-wider font-bold mb-1">Range</p>
                          <p className="text-[20px] font-black text-text-main">{car.specifications.range} <span className="text-[14px] text-primary-main">km</span></p>
                        </div>
                      )}
                      {car.specifications.motorPower && (
                        <div className="p-5 text-center">
                          <p className="text-[12px] text-text-muted uppercase tracking-wider font-bold mb-1">Power</p>
                          <p className="text-[20px] font-black text-text-main">{Math.round(car.specifications.motorPower * 1.341)} <span className="text-[14px] text-primary-main">HP</span></p>
                        </div>
                      )}
                      {car.specifications.driveTrain && (
                        <div className="p-5 text-center">
                          <p className="text-[12px] text-text-muted uppercase tracking-wider font-bold mb-1">Drive</p>
                          <p className="text-[20px] font-black text-text-main">{car.specifications.driveTrain}</p>
                        </div>
                      )}
                      {car.specifications.interiorColor && (
                        <div className="p-5 text-center">
                          <p className="text-[12px] text-text-muted uppercase tracking-wider font-bold mb-1">Interior</p>
                          <p className="text-[20px] font-black text-text-main truncate" title={car.specifications.interiorColor}>{car.specifications.interiorColor}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Premium Features */}
              {car.specifications?.features && car.specifications.features.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                     <Heart size={20} className="text-primary-main" />
                     <h3 className="text-lg font-black text-text-main">Premium Features</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {car.specifications.features.map((feature: string, idx: number) => (
                        <Badge key={idx} variant="default" className="bg-surface-card border-border-subtle/30 text-text-main py-1.5 px-3">
                           {feature}
                        </Badge>
                     ))}
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {car.gallery && car.gallery.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                     <ImageIcon size={20} className="text-primary-main" />
                     <h3 className="text-lg font-black text-text-main">Visuals</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {car.gallery.map((img: string, idx: number) => (
                      <a href={img} target="_blank" rel="noopener noreferrer" key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-bg-secondary cursor-pointer border border-border-subtle/30 shadow-sm">
                        <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                           <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
           </div>

           {/* Sidebar Column */}
           <div className="space-y-6">
              
              {/* Asset Financials */}
              <div className="bg-surface-card border border-border-subtle/30 rounded-3xl p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="text-[18px] text-primary-main font-serif">ብር</span>
                    <h3 className="text-[15px] font-black text-text-main">Asset Financials</h3>
                 </div>
                 <div className="space-y-4">
                    {car.unitCost > 0 && (
                       <div className="flex justify-between items-center pb-3 border-b border-border-subtle/30">
                          <p className="text-[13px] text-text-muted">Procurement Cost</p>
                          <p className="text-[14px] font-bold text-text-main">{new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(car.unitCost)}</p>
                       </div>
                    )}
                    <div className="flex justify-between items-center pb-3 border-b border-border-subtle/30">
                       <p className="text-[13px] text-text-muted">Floor Plan Loan</p>
                       <Badge variant={car.floorPlanLoan ? "warning" : "success"} className="text-[11px]">
                          {car.floorPlanLoan ? 'Active' : 'Clear'}
                       </Badge>
                    </div>
                    {car.floorPlanLoan && car.maturityDate && (
                       <div className="flex justify-between items-center">
                          <p className="text-[13px] text-text-muted">Maturity Date</p>
                          <p className="text-[13px] font-bold text-warning">{new Date(car.maturityDate).toLocaleDateString()}</p>
                       </div>
                    )}
                 </div>
              </div>

              {/* Asset Lifecycle */}
              <div className="bg-surface-card border border-border-subtle/30 rounded-3xl p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
                 <div className="flex items-center gap-2 mb-4">
                    <Settings size={18} className="text-primary-main" />
                    <h3 className="text-[15px] font-black text-text-main">Asset Lifecycle</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border-subtle/30">
                       <p className="text-[13px] text-text-muted">System Entry</p>
                       <p className="text-[13px] font-medium text-text-main">{car.createdAt ? new Date(car.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                    {car.soldDate && (
                       <div className="flex justify-between items-center">
                          <p className="text-[13px] text-text-muted">Disposition Date</p>
                          <p className="text-[13px] font-medium text-success">{new Date(car.soldDate).toLocaleDateString()}</p>
                       </div>
                    )}
                 </div>
              </div>

              {/* Internal Documents */}
              <div className="bg-surface-card border border-border-subtle/30 rounded-3xl p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <FileText size={18} className="text-primary-main" />
                       <h3 className="text-[15px] font-black text-text-main">Dossier</h3>
                    </div>
                    <Badge variant="default" className="bg-bg-secondary text-text-muted">{car.internalDocuments?.length || 0}</Badge>
                 </div>
                 
                 {(!car.internalDocuments || car.internalDocuments.length === 0) ? (
                    <div className="py-6 text-center border border-dashed border-border-subtle/50 rounded-2xl">
                       <FileText size={24} className="mx-auto text-border-strong mb-2" />
                       <p className="text-[13px] text-text-muted font-medium">No documents</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                      {car.internalDocuments.map((doc: any, idx: number) => (
                        <DocumentPreviewButton 
                          url={doc.url || doc} 
                          title={doc.name || `Attachment ${idx + 1}`}
                          key={idx} 
                          className="flex items-center justify-between p-3 rounded-2xl border border-border-subtle/30 bg-bg-base hover:border-primary-main/30 hover:bg-bg-secondary transition-all group w-full"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-primary-main/10 flex items-center justify-center shrink-0">
                              <FileText size={14} className="text-primary-main" />
                            </div>
                            <p className="text-[13px] font-bold text-text-main truncate group-hover:text-primary-main transition-colors">
                              {doc.name || `Attachment ${idx + 1}`}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-text-muted shrink-0 group-hover:translate-x-1 transition-transform" />
                        </DocumentPreviewButton>
                      ))}
                    </div>
                 )}
              </div>
           </div>
           
        </div>
      </div>
    </div>
  );
};
