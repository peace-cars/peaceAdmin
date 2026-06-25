import React from 'react';
import { Car, Package, Network, FileText, Zap } from 'lucide-react';
import { SkeletonKpi } from '../ui/Skeleton';

interface MobileKpisProps {
  totalValue: number;
  inventoryCount: number;
  branchCount: number;
  archiveCount: number;
  loading: boolean;
}

export const MobileKpis: React.FC<MobileKpisProps> = ({
  totalValue,
  inventoryCount,
  branchCount,
  archiveCount,
  loading,
}) => (
  <div className="flex flex-col gap-3">
    {/* Total Portfolio Value card with wave chart */}
    {loading ? (
      <SkeletonKpi className="h-32" />
    ) : (
      <div className="bg-surface-card rounded-[20px] shadow-sm border border-border-subtle/30 overflow-hidden relative">
        <div className="p-5 pb-14">
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
              Total Portfolio Value
            </p>
            <Car size={16} className="text-text-muted" />
          </div>
          <p className="mt-2 text-[26px] font-black tracking-tight text-text-main">
            {(totalValue / 1000000).toFixed(1)}M ETB
          </p>
        </div>
        {/* Wavy SVG chart approximation */}
        <div className="absolute bottom-0 left-0 w-full h-14 overflow-hidden">
          <svg
            viewBox="0 0 400 48"
            preserveAspectRatio="none"
            className="w-full h-full text-[#2196f3]"
          >
            <path
              d="M0,36 C50,24 100,44 150,30 C200,14 250,36 300,24 C350,12 380,30 400,24 L400,48 L0,48 Z"
              fill="currentColor"
              fillOpacity="0.1"
            />
            <path
              d="M0,36 C50,24 100,44 150,30 C200,14 250,36 300,24 C350,12 380,30 400,24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>
    )}

    {/* 2×2 secondary KPI grid */}
    <div className="grid grid-cols-2 gap-3">
      {loading ? (
        <>
          <SkeletonKpi className="h-28" />
          <SkeletonKpi className="h-28" />
          <SkeletonKpi className="h-28" />
          <SkeletonKpi className="h-28" />
        </>
      ) : (
        [
          { label: 'Inventory', value: `${inventoryCount} assets`, icon: <Package size={14} /> },
          { label: 'Active Branches', value: String(branchCount), icon: <Network size={14} /> },
          { label: 'Archives', value: String(archiveCount), icon: <FileText size={14} /> },
          {
            label: 'Portfolio Details',
            value: `${(totalValue / 1000000).toFixed(1)}M ETB`,
            icon: <Zap size={14} />,
          },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-surface-card rounded-[16px] p-4 shadow-sm border border-border-subtle/30 flex flex-col"
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
                {label}
              </p>
              <span className="text-text-muted">{icon}</span>
            </div>
            <p className="mt-2 text-[15px] font-black tracking-tight text-text-main">{value}</p>
          </div>
        ))
      )}
    </div>
  </div>
);
