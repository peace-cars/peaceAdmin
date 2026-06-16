import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Car, DollarSign, Calendar, Building2, Gauge, Zap, Battery,
  ShieldCheck, FileText, Image as ImageIcon, Package, Hash, CreditCard,
  TrendingUp, CheckCircle2, MapPin, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { api } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { DocumentPreviewButton } from '../components/ui/DocumentViewerModal';
import { SalesReceipt } from '../components/documents/SalesReceipt';
import { Badge } from '../components/ui/Badge';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

/* ─── Section Card wrapper ─────────────────────────────────────── */
const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-surface-card rounded-2xl border border-border-subtle/30 overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-border-subtle/20">
      <div className="w-8 h-8 rounded-xl bg-primary-main/10 flex items-center justify-center text-primary-main">
        {icon}
      </div>
      <h2 className="text-[13px] font-bold text-text-main">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ─── Key-Value row ─────────────────────────────────────────────── */
const Row = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) => (
  <div className="flex items-start justify-between py-3 border-b border-border-subtle/15 last:border-b-0">
    <span className="text-[12px] font-medium text-text-muted/70 flex-shrink-0 pr-4">{label}</span>
    <span className={`text-[13px] font-bold text-right ${accent ? 'text-success-main' : 'text-text-main'}`}>
      {value ?? <span className="text-text-muted/40 font-normal italic">N/A</span>}
    </span>
  </div>
);

/* ─── Image Lightbox ────────────────────────────────────────────── */
const Lightbox = ({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) => {
  const [current, setCurrent] = useState(index);
  const prev = () => setCurrent(i => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrent(i => (i === images.length - 1 ? 0 : i + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-16 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <img
        src={images[current]}
        alt={`Image ${current + 1}`}
        className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl"
        onClick={e => e.stopPropagation()}
      />

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); setCurrent(i); }}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────────── */
export default function SoldArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<any>(`/vehicles/${id}`)
      .then(data => setVehicle(data))
      .catch(err => console.error('[SoldArchiveDetail] Fetch failed', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <Skeleton className="w-40 h-5" />
        <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-6">
           <Skeleton className="w-16 h-6 mb-2" />
           <Skeleton className="w-3/4 h-8 mb-2" />
           <Skeleton className="w-1/2 h-4" />
        </div>
        <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-6">
           <Skeleton className="w-32 h-6 mb-4" />
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Skeleton className="aspect-video rounded-xl" />
             <Skeleton className="aspect-video rounded-xl" />
             <Skeleton className="aspect-video rounded-xl" />
             <Skeleton className="aspect-video rounded-xl" />
           </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-6">
              <Skeleton className="w-48 h-6 mb-6" />
              <SkeletonText lines={5} />
           </div>
           <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-6">
              <Skeleton className="w-48 h-6 mb-6" />
              <SkeletonText lines={5} />
           </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-[60vh] flex-col gap-4">
        <Package size={40} className="text-text-muted/30" />
        <p className="text-text-muted font-medium">Vehicle record not found.</p>
        <button onClick={() => navigate('/archive')} className="text-primary-main font-bold text-sm underline">
          Back to Archive
        </button>
      </div>
    );
  }

  const images: string[] = vehicle.images || [];
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const retailPrice = Number(vehicle.retail_price_etb) || 0;
  const unitCost = Number(vehicle.unit_cost) || 0;
  const profit = retailPrice - unitCost;
  const margin = retailPrice > 0 ? ((profit / retailPrice) * 100).toFixed(1) : '0';
  const branchName = vehicle.branches?.name || 'Main Registry';
  const soldDate = vehicle.sold_date ? new Date(vehicle.sold_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* ── Back button + Header ── */}
      <div>
        <button
          onClick={() => navigate('/archive')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-4 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[12px] font-bold">Back to Sold Archive</span>
        </button>

        <div className="bg-surface-card rounded-2xl border border-border-subtle/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="success" className="bg-success/10 text-success border-none text-[11px] font-bold">
                  SOLD
                </Badge>
                {vehicle.plate_code && (
                  <Badge variant="default" className="font-mono text-[11px] text-text-muted/70">
                    {vehicle.plate_code}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-black text-text-main tracking-tight leading-tight">{name}</h1>
              <p className="text-[12px] text-text-muted/60 font-medium mt-1 flex items-center gap-1.5">
                <Building2 size={11} /> {branchName} · <Calendar size={11} /> Sold {soldDate}
              </p>
            </div>

            {/* KPI quick-view */}
            <div className="flex gap-4 shrink-0">
              <div className="text-center px-5 py-3 bg-bg-secondary rounded-xl">
                <p className="text-[11px] text-text-muted/60 font-medium mb-1">Sale Price</p>
                <p className="text-lg font-black text-text-main tracking-tight">
                  {(retailPrice / 1_000_000).toFixed(2)}M
                </p>
              </div>
              <div className="text-center px-5 py-3 bg-success/5 rounded-xl border border-success/20">
                <p className="text-[11px] text-success/70 font-medium mb-1">Net Profit</p>
                <p className="text-lg font-black text-success-main tracking-tight">
                  +{(profit / 1_000_000).toFixed(2)}M
                </p>
              </div>
              <div className="text-center px-5 py-3 bg-bg-secondary rounded-xl">
                <p className="text-[11px] text-text-muted/60 font-medium mb-1">Margin</p>
                <p className="text-lg font-black text-text-main tracking-tight">{margin}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gallery ── */}
      {images.length > 0 ? (
        <Section title="Gallery" icon={<ImageIcon size={15} />}>
          <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
            {images.map((src, i) => (
              <div
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="aspect-video bg-bg-secondary rounded-xl overflow-hidden cursor-pointer group relative"
              >
                <img src={src} alt={`${name} ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ImageIcon size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {i === 0 && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">Cover</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section title="Gallery" icon={<ImageIcon size={15} />}>
          <div className="flex flex-col items-center justify-center py-10 text-text-muted/40">
            <ImageIcon size={36} className="mb-3 opacity-30" />
            <p className="text-[12px] font-medium">No images uploaded for this vehicle.</p>
          </div>
        </Section>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Vehicle Details ── */}
        <Section title="Vehicle Details" icon={<Car size={15} />}>
          <Row label="Make" value={vehicle.make} />
          <Row label="Model" value={vehicle.model} />
          <Row label="Year" value={vehicle.year} />
          <Row label="Fuel Type" value={vehicle.fuel} />
          <Row label="Drive Train" value={vehicle.drive_train || 'N/A'} />
          <Row label="Interior Color" value={vehicle.interior_color} />
          <Row label="VIN / Chassis" value={<span className="font-mono text-[12px]">{vehicle.vin_chassis}</span>} />
          <Row label="Plate Code" value={vehicle.plate_code} />
        </Section>

        {/* ── Financials ── */}
        <Section title="Financial Summary" icon={<DollarSign size={15} />}>
          <Row label="Unit Cost" value={`ETB ${unitCost.toLocaleString()}`} />
          <Row label="Sale Price" value={`ETB ${retailPrice.toLocaleString()}`} />
          <Row label="Gross Profit" value={`ETB ${profit.toLocaleString()}`} accent />
          <Row label="Profit Margin" value={`${margin}%`} accent />
          <Row label="Floor Plan Loan" value={vehicle.floor_plan_loan ? '✓ Yes' : 'No'} />
          {vehicle.maturity_date && (
            <Row label="Loan Maturity" value={new Date(vehicle.maturity_date).toLocaleDateString()} />
          )}
          <Row label="Sold Date" value={soldDate} />
          <Row label="Branch" value={branchName} />
        </Section>

        {/* ── Specs / Condition ── */}
        <Section title="Specifications & Condition" icon={<ShieldCheck size={15} />}>
          {vehicle.fuel === 'ELECTRIC' || vehicle.battery_soh_percent ? (
            <>
              <Row label="Battery SOH" value={vehicle.battery_soh_percent ? `${vehicle.battery_soh_percent}%` : null} />
              <Row label="Battery Capacity" value={vehicle.battery_capacity_kwh ? `${vehicle.battery_capacity_kwh} kWh` : null} />
              <Row label="Motor Power" value={vehicle.motor_power_kw ? `${Math.round(vehicle.motor_power_kw * 1.341)} HP` : null} />
              <Row label="Range" value={vehicle.range_km ? `${vehicle.range_km} km` : null} />
            </>
          ) : null}
          <Row label="Certified KM" value={vehicle.certified_km ? `${Number(vehicle.certified_km).toLocaleString()} km` : null} />
          <Row label="Status at Archive" value={
            <Badge variant="success" className="bg-success/10 text-success border-none text-[10px] font-bold">SOLD</Badge>
          } />
        </Section>

        {/* ── Features ── */}
        <Section title="Features & Equipment" icon={<CheckCircle2 size={15} />}>
          {vehicle.features && vehicle.features.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((f: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-bg-secondary border border-border-subtle/30 rounded-full text-[11px] font-bold text-text-main"
                >
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-text-muted/40 italic font-medium">No features listed.</p>
          )}
        </Section>
        
        {/* ── Internal Documents ── */}
        <Section title="Internal Documents" icon={<FileText size={15} />}>
          {(vehicle.internal_documents || vehicle.internalDocuments || vehicle.documents) && (vehicle.internal_documents?.length > 0 || vehicle.internalDocuments?.length > 0 || vehicle.documents?.length > 0) ? (
            <div className="flex flex-col gap-3">
              {(vehicle.internal_documents || vehicle.internalDocuments || vehicle.documents).map((doc: string, i: number) => {
                const filename = doc.split('/').pop()?.split('?')[0] || `Document ${i + 1}`;
                return (
                  <DocumentPreviewButton
                    key={i}
                    url={doc}
                    title={filename}
                    className="flex items-center gap-3 p-3 bg-surface-hover border border-border-subtle/30 rounded-xl hover:bg-surface-hover/80 transition-colors w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary-main flex items-center justify-center shrink-0">
                      <FileText size={14} />
                    </div>
                    <span className="text-[13px] font-bold text-text-main truncate">{filename}</span>
                  </DocumentPreviewButton>
                );
              })}
            </div>
          ) : (
             <p className="text-[12px] text-text-muted/40 italic font-medium">No internal documents attached.</p>
          )}
        </Section>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
