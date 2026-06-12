import React, { useState } from 'react';
import { ChevronRight, Car, Camera, User, Phone, DollarSign, MapPin, Printer, Search, CheckCircle, Loader2, Package } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

interface AcquisitionDossierModalProps {
  selectedLead: any;
  onClose: () => void;
  branchStaff: any[];
  onAssignStaff: (leadId: string, staffId: string) => void;
  onPrint: () => void;
  onViewReport: () => void;
  onUpdateStatus: (leadId: string, status: string) => void;
  onRefresh?: () => void;
  isSubmitting?: boolean;
}

export const AcquisitionDossierModal: React.FC<AcquisitionDossierModalProps> = ({
  selectedLead,
  onClose,
  branchStaff,
  onAssignStaff,
  onPrint,
  onViewReport,
  onUpdateStatus,
  onRefresh,
  isSubmitting,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Acquire to Fleet state
  const [showAcquireForm, setShowAcquireForm] = useState(false);
  const [acquiring, setAcquiring] = useState(false);
  const [acquireForm, setAcquireForm] = useState({
    vin: '',
    retailPrice: '',
    vehicleStatus: 'REFURBISHMENT' as 'REFURBISHMENT' | 'SHOWROOM' | 'SOLD',
  });
  const [acquireSuccess, setAcquireSuccess] = useState(false);

  if (!selectedLead) return null;

  const isNegotiating = selectedLead.status === 'NEGOTIATING';
  const isAccepted = selectedLead.status === 'ACCEPTED';

  const handleAcquire = async () => {
    if (!acquireForm.retailPrice) {
      alert('Please enter the retail price for the inventory listing.');
      return;
    }
    setAcquiring(true);
    try {
      await api.patch(`/trade-in-requests/${selectedLead.id}/acquire`, {
        vin: acquireForm.vin || undefined,
        retailPrice: Number(acquireForm.retailPrice.replace(/,/g, '')),
        vehicleStatus: acquireForm.vehicleStatus,
      });
      setAcquireSuccess(true);
      onRefresh?.();
      setTimeout(() => {
        onClose();
        setAcquireSuccess(false);
        setShowAcquireForm(false);
      }, 1800);
    } catch (e: any) {
      alert(e?.message || 'Acquisition failed. Please try again.');
    } finally {
      setAcquiring(false);
    }
  };

  return (
    <Modal
      isOpen={!!selectedLead}
      onClose={onClose}
      title="Asset Dossier"
      subtitle="Complete vehicle evaluation and management console"
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="outline" className="flex-1 h-12" onClick={onClose}>Close</Button>
          <Button variant="primary" className="flex-1 h-12 shadow-lg shadow-primary-main/20" onClick={onPrint}>Print Dossier</Button>
        </>
      }
    >
      <div className="space-y-8">
        {/* Photo Gallery */}
        {selectedLead.photos && selectedLead.photos.length > 0 ? (
          <div className="space-y-6 mb-10">
            <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle transition-all duration-300 relative overflow-hidden group">
              <img 
                src={selectedLead.photos[activePhotoIdx] || selectedLead.photos[0]} 
                alt={selectedLead.vehicle} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover/photo:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity" />
              
              {selectedLead.photos.length > 1 && (
                <>
                  <button 
                    onClick={() => setActivePhotoIdx(prev => prev > 0 ? prev - 1 : selectedLead.photos.length - 1)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all hover:bg-black/60 shadow-lg"
                  >
                    <ChevronRight size={24} className="rotate-180" />
                  </button>
                  <button 
                    onClick={() => setActivePhotoIdx(prev => prev < selectedLead.photos.length - 1 ? prev + 1 : 0)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all hover:bg-black/60 shadow-lg"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-2xl mb-1">{selectedLead.vehicle}</h3>
                <Badge variant="default" className="font-mono bg-black/40 text-white border-white/20 px-3 py-1 shadow-sm">
                  REF: {selectedLead.id.substring(0,8).toUpperCase()}
                </Badge>
              </div>
            </div>

            {selectedLead.photos.length > 1 && (
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {selectedLead.photos.map((photo: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActivePhotoIdx(idx)}
                    className={cn(
                      "w-24 aspect-[16/9] rounded-2xl overflow-hidden border-2 shrink-0 transition-all shadow-sm",
                      idx === activePhotoIdx ? "border-primary-main shadow-lg scale-105" : "border-border-subtle opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={photo} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-bg-secondary border border-border-subtle rounded-2xl flex items-center justify-center text-text-muted shrink-0 shadow-inner">
              <Car size={40} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-2xl font-bold text-text-main tracking-tight leading-tight">{selectedLead.vehicle}</h3>
              <Badge variant="default" className="font-mono bg-bg-secondary">REF: {selectedLead.id.substring(0,8).toUpperCase()}</Badge>
            </div>
          </div>
        )}

        {/* ── Negotiation Alert ── */}
        {isNegotiating && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 overflow-hidden">
            <div className="px-5 py-3 bg-amber-500/15 border-b border-amber-500/20 flex items-center gap-2">
              <span className="text-sm font-black text-amber-600 uppercase tracking-wider">⚡ Counter-Offer Received</span>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Your Offer</p>
                <p className="text-xl font-black text-text-main">
                  {Number(selectedLead.finalOffer || 0).toLocaleString()} <span className="text-xs text-primary-main">ETB</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Client Counter</p>
                <p className="text-xl font-black text-amber-600">
                  {Number(selectedLead.askingPrice || 0).toLocaleString()} <span className="text-xs">ETB</span>
                </p>
              </div>
            </div>
            <div className="px-5 pb-4">
              <p className="text-xs text-text-secondary">To accept the counter, set a new offer via <strong>Approve Lead</strong> matching the client's price, or move to <strong>NEGOTIATING</strong> to counter again.</p>
            </div>
          </div>
        )}

        {/* ── Acquire to Fleet ── */}
        {isAccepted && (
          <div className="rounded-2xl border border-success/30 bg-success/5 overflow-hidden">
            <div className="px-5 py-3 bg-success/10 border-b border-success/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span className="text-sm font-black text-success uppercase tracking-wider">Deal Accepted by Client</span>
              </div>
              <Badge variant="default" className="text-success border-success/30 bg-success/10">
                {Number(selectedLead.finalOffer || selectedLead.askingPrice || 0).toLocaleString()} ETB
              </Badge>
            </div>
            <div className="px-5 py-4 space-y-4">
              {acquireSuccess ? (
                <div className="flex items-center gap-3 py-3">
                  <CheckCircle size={22} className="text-success" />
                  <p className="font-black text-success">
                    Vehicle added to fleet! Moving to{' '}
                    {acquireForm.vehicleStatus === 'REFURBISHMENT' ? 'Reconditioning' : acquireForm.vehicleStatus === 'SHOWROOM' ? 'Showroom' : 'Sold'}...
                  </p>
                </div>
              ) : showAcquireForm ? (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary font-medium">
                    Choose where this vehicle goes in your fleet after acquisition.
                  </p>

                  {/* Destination selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'REFURBISHMENT', label: 'Reconditioning', desc: 'Needs work before listing', icon: '🔧' },
                      { value: 'SHOWROOM',      label: 'Showroom',        desc: 'Ready to sell now',        icon: '🏪' },
                      { value: 'SOLD',          label: 'Mark as Sold',    desc: 'Already sold off-market',  icon: '✅' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAcquireForm(p => ({ ...p, vehicleStatus: opt.value }))}
                        className={cn(
                          'flex flex-col items-center text-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-bold',
                          acquireForm.vehicleStatus === opt.value
                            ? 'border-primary-main bg-primary-main/10 text-primary-main'
                            : 'border-border-subtle text-text-muted hover:border-primary-main/40'
                        )}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <span>{opt.label}</span>
                        <span className="font-normal text-[10px] opacity-70 leading-tight">{opt.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">VIN / Chassis (optional)</label>
                      <input
                        type="text"
                        placeholder="Auto-generated if empty"
                        value={acquireForm.vin}
                        onChange={e => setAcquireForm(p => ({ ...p, vin: e.target.value }))}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary-main/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Retail Price (ETB) *</label>
                      <input
                        type="number"
                        placeholder={String(selectedLead.finalOffer || '')}
                        value={acquireForm.retailPrice}
                        onChange={e => setAcquireForm(p => ({ ...p, retailPrice: e.target.value }))}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary-main/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="primary" className="flex-1 h-10" onClick={handleAcquire}>
                      {acquiring
                        ? <><Loader2 size={14} className="animate-spin mr-2" /> Acquiring...</>
                        : <><Package size={14} className="mr-2" /> Confirm Acquisition</>
                      }
                    </Button>
                    <Button variant="outline" className="h-10 px-4" onClick={() => setShowAcquireForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm text-text-secondary">
                    Client has accepted the offer. Confirm acquisition to add this vehicle to the showroom fleet.
                  </p>
                  <Button
                    variant="primary"
                    className="shrink-0 h-10 px-5 shadow-md shadow-primary-main/20"
                    onClick={() => setShowAcquireForm(true)}
                  >
                    <Package size={14} className="mr-2" /> Acquire to Fleet
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-10">
          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-text-muted font-medium flex items-center gap-2"><User size={10} /> Customer</p>
            <p className="text-sm font-bold text-text-main tracking-tight">{selectedLead.customer}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-text-muted font-medium flex items-center gap-2"><Phone size={10} /> Phone</p>
            <a href={`tel:${selectedLead.phone}`} className="text-sm font-bold text-primary-main tracking-tight hover:underline">{selectedLead.phone || 'Not provided'}</a>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-text-muted font-medium flex items-center gap-2"><DollarSign size={10} /> Asking Price</p>
            <p className="text-lg font-bold text-text-main tracking-tight">
              {(selectedLead.askingPrice || 0).toLocaleString()} <span className="text-[11px] text-primary-main ml-0.5 font-mono">ETB</span>
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-text-muted font-medium flex items-center gap-2"><MapPin size={10} /> Branch</p>
            <p className="text-sm font-bold text-text-main tracking-tight">{selectedLead.location || 'Unassigned'}</p>
          </div>
          
          {selectedLead.vehicleDetails && Object.keys(selectedLead.vehicleDetails).length > 0 && (
            <div className="col-span-2 grid grid-cols-3 gap-y-6 gap-x-6 pt-4 border-t border-border-subtle">
              <div className="space-y-1.5">
                <p className="text-[13px] font-bold text-text-muted font-medium">Tech Specs</p>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-text-main">{selectedLead.vehicleDetails.fuel_type?.replace('_', ' ')} • {selectedLead.vehicleDetails.transmission}</p>
                  <p className="text-xs text-text-secondary">{selectedLead.vehicleDetails.drive_type} • {Number(selectedLead.vehicleDetails.mileage).toLocaleString()} KM</p>
                </div>
              </div>
              
              {['ELECTRIC', 'HYBRID'].includes(selectedLead.vehicleDetails.fuel_type) ? (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-bold text-text-muted font-medium">Battery & EV</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-emerald-600">{selectedLead.vehicleDetails.battery_kwh} kWh • {selectedLead.vehicleDetails.battery_soh}% SoH</p>
                    <p className="text-xs text-text-secondary">Charger: {selectedLead.vehicleDetails.charger_type?.replace('_', ' ')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-bold text-text-muted font-medium">Engine</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.vehicleDetails.engine_cc} CC</p>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-[13px] font-bold text-text-muted font-medium">Legal Status</p>
                 <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                     <Badge variant={selectedLead.vehicleDetails.duty_status === 'DUTY_PAID' ? 'primary' : 'default'} className="px-2 py-0.5 text-[12px]">{selectedLead.vehicleDetails.duty_status === 'DUTY_PAID' ? 'Tax Paid' : selectedLead.vehicleDetails.duty_status === 'DUTY_FREE' ? 'Tax Exempt' : selectedLead.vehicleDetails.duty_status?.replace('_', ' ')}</Badge>
                     <Badge variant="default" className="px-2 py-0.5 text-[12px] bg-warning/10 text-warning border border-warning/20">{selectedLead.vehicleDetails.libre_status?.replace('_', ' ')} Libre</Badge>
                  </div>
                  <p className="text-xs text-text-secondary">Accidents: {selectedLead.vehicleDetails.accident_history?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-text-muted font-medium">Description & Plate</p>
            <p className="text-xs text-text-secondary">{selectedLead.plate || 'No description'}</p>
          </div>
          
          {selectedLead.financing && (
            <div className="col-span-2 bg-warning/10 border border-warning/20 p-3 rounded-xl">
              <p className="text-[13px] font-bold text-warning font-medium">⚡ Finance Audit Requested</p>
            </div>
          )}
          
          {selectedLead.status === 'NEW_LEAD' && (
            <div className="col-span-2 pt-4 border-t border-border-subtle">
               <p className="text-[13px] font-bold text-text-muted font-medium mb-3">Assign for Technical Evaluation</p>
               <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <select 
                      className="w-full bg-bg-secondary border border-border-subtle text-xs font-medium h-12 px-6 rounded-2xl text-text-main outline-none focus:border-primary-main/30 appearance-none cursor-pointer transition-all pr-12 shadow-sm disabled:opacity-50"
                      onChange={(e) => onAssignStaff(selectedLead.id, e.target.value)}
                      defaultValue=""
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>Select available staff member...</option>
                      {branchStaff.map(s => <option key={s.id} value={s.id}>{s.fullName || s.full_name}</option>)}
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted rotate-90 pointer-events-none" />
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Advance Pipeline */}
        <div className="pt-6 border-t border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-text-muted font-medium">Advance Pipeline Stage</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onPrint}
              className="h-8 px-3 text-[12px] font-medium rounded-lg border-primary-main/30 text-primary-main hover:bg-primary-subtle"
            >
              <Printer size={12} className="mr-1.5" /> Print Evaluation
            </Button>
            {selectedLead.inspections?.length > 0 && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={onViewReport}
                className="h-8 px-3 text-[12px] font-medium rounded-lg"
              >
                <Search size={12} className="mr-1.5" /> View Technical Evaluation
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {['NEW_LEAD', 'INSPECTION_PENDING', 'CLARIFICATION_REQUIRED', 'MANAGER_REVIEW', 'OFFER_MADE', 'NEGOTIATING', 'ACCEPTED', 'RECONDITIONING', 'STALE', 'REJECTED', 'CLOSED_LOST'].map(stage => (
              <button 
                key={stage}
                onClick={() => onUpdateStatus(selectedLead.id, stage)}
                disabled={isSubmitting}
                className={cn(
                  "py-2 px-3 rounded-lg text-[11px] font-medium border transition-all active:scale-95 shadow-sm whitespace-nowrap",
                  selectedLead.status === stage 
                    ? "bg-text-main text-bg border-text-main shadow-md" 
                    : stage === 'REJECTED' || stage === 'CLOSED_LOST'
                      ? "bg-error-main/10 text-error-main border-error-main/20 hover:bg-error-main/20"
                      : "bg-surface-card text-text-secondary border-border-subtle hover:text-primary-main",
                  isSubmitting && "opacity-50 pointer-events-none"
                )}
              >
                {stage.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
