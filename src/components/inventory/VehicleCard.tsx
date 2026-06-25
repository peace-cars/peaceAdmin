import React from 'react';
import { Heart, Printer } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProgressiveImage } from '../ui/ProgressiveImage';

/** Map a status string to a tailwind badge class set */
export function getStatusStyle(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('SHOWROOM') || s.includes('AVAILABLE'))
    return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  if (s.includes('SOLD')) return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
  if (s.includes('SOURCING')) return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  return 'bg-bg-secondary text-text-muted border-border-subtle/30';
}

interface VehicleCardProps {
  car: any;
  onOpen: () => void;
  onPrint: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ car, onOpen, onPrint }) => (
  <div
    onClick={onOpen}
    className="flex flex-col bg-surface-card rounded-[16px] overflow-hidden border border-border-subtle/30 shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
  >
    {/* Image */}
    <div className="relative w-full aspect-[4/3] bg-bg-secondary">
      <ProgressiveImage src={car.image} alt={car.model} className="w-full h-full" />

      {/* Status badge top-left */}
      <div
        className={cn(
          'absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[8px] font-bold shadow-sm uppercase border',
          getStatusStyle(car.status),
        )}
      >
        {car.status}
      </div>

      {/* Heart top-right */}
      <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm">
        <Heart size={12} className="text-white" />
      </div>

      {/* Print button bottom-right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrint();
        }}
        className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-all active:scale-90"
        title="Print Receipt"
      >
        <Printer size={10} className="text-white" />
      </button>
    </div>

    {/* Details */}
    <div className="p-2.5 flex flex-col gap-1">
      <h4 className="text-[11px] font-bold text-text-main leading-tight truncate">
        {car.year} {car.make} {car.model}
      </h4>
      <p className="text-[9px] text-text-muted font-medium truncate">
        ID: {car.id.substring(0, 6)} &bull;{' '}
        {car.certifiedKm ? `${Number(car.certifiedKm).toLocaleString()} KM` : 'N/A'}
      </p>
      <p className="text-[13px] font-black text-text-main">{car.priceFormatted}</p>
      {/* Duty / Tax pill */}
      <span
        className={cn(
          'self-start rounded-full px-2 py-0.5 text-[8px] font-bold border mt-0.5',
          car.duty === 'DUTY PAID'
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        )}
      >
        {car.duty === 'DUTY PAID' ? 'TAX PAID' : car.duty === 'DUTY FREE' ? 'TAX FREE' : car.duty}
      </span>
    </div>
  </div>
);
