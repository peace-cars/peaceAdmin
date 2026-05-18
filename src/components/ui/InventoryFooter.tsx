import React from 'react';
import { Building2, Package, LayoutGrid, Settings } from 'lucide-react';

interface InventoryFooterProps {
  totalValue: number;
}

export const InventoryFooter: React.FC<InventoryFooterProps> = ({ totalValue }) => {
  return (
    <div className="bg-surface-card border border-border-subtle/30 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-main/0 via-primary-main/30 to-primary-main/0" />
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-16 relative z-10">
        <div className="space-y-1">
          <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-tight">Consolidated Portfolio Value</p>
          <p className="text-3xl md:text-4xl font-bold text-text-main tracking-tight leading-none">
            {(totalValue / 1000000).toFixed(2)}M <span className="text-[14px] text-primary-main ml-1">ETB</span>
          </p>
        </div>
        <div className="hidden md:block w-px h-16 bg-border-subtle/30" />
        <div className="space-y-1">
          <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-tight">Network Compliance Rating</p>
          <p className="text-3xl md:text-4xl font-bold text-success tracking-tight leading-none">
            100% <span className="text-[14px] text-text-muted/60 ml-2 uppercase font-bold tracking-widest">Secure</span>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-6 text-border-subtle/30">
        <Building2 size={32} /> 
        <Package size={32} /> 
        <LayoutGrid size={32} /> 
        <Settings size={32} />
      </div>
    </div>
  );
};
