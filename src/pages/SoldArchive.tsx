/**
 * SoldArchive.tsx
 *
 * Componentized for maintainability. Sub-components:
 *   ArchiveKpis, ArchiveCard, ArchiveGrid, ArchiveDesktopTable
 *
 * All original functionality preserved. Mobile UI updated to match InventoryManager pattern.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  DollarSign,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  Archive,
  Heart,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache, apiCache } from '../lib/cache';
import { KpiTile } from '../components/ui/KpiTile';
import { Tooltip } from '../components/ui/Tooltip';
import { Badge } from '../components/ui/Badge';
import { ProgressiveImage } from '../components/ui/ProgressiveImage';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile KPIs
// ─────────────────────────────────────────────────────────────────────────────
interface ArchiveKpisProps {
  totalRevenue: number;
  totalProfit: number;
  totalUnits: number;
  avgMargin: number;
}

const ArchiveKpis: React.FC<ArchiveKpisProps> = ({
  totalRevenue,
  totalProfit,
  totalUnits,
  avgMargin,
}) => (
  <div className="flex flex-col gap-3">
    {/* Primary card — Net Profit with wave */}
    <div className="bg-surface-card rounded-[20px] shadow-sm border border-border-subtle/30 overflow-hidden relative">
      <div className="p-5 pb-14">
        <div className="flex justify-between items-start">
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
            Total Net Profit
          </p>
          <DollarSign size={16} className="text-success-main" />
        </div>
        <p className="mt-2 text-[26px] font-black tracking-tight text-success-main">
          {(totalProfit / 1000000).toFixed(2)}M
          <span className="text-[14px] font-bold text-success-main/60 ml-2">ETB</span>
        </p>
      </div>
      {/* Wave chart approximation */}
      <div className="absolute bottom-0 left-0 w-full h-14 overflow-hidden">
        <svg
          viewBox="0 0 400 48"
          preserveAspectRatio="none"
          className="w-full h-full text-success-main"
        >
          <path
            d="M0,38 C70,20 140,42 200,26 C260,10 320,36 370,22 C385,16 395,24 400,20 L400,48 L0,48 Z"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <path
            d="M0,38 C70,20 140,42 200,26 C260,10 320,36 370,22 C385,16 395,24 400,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </div>

    {/* 2×2 KPI grid */}
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Units Sold', value: String(totalUnits), icon: <Package size={14} />, color: 'text-primary-main' },
        { label: 'Gross Revenue', value: `${(totalRevenue / 1000000).toFixed(1)}M ETB`, icon: <DollarSign size={14} />, color: 'text-emerald-400' },
        { label: 'Average Margin', value: `${avgMargin.toFixed(1)}%`, icon: <DollarSign size={14} />, color: 'text-amber-400' },
        { label: 'Active Branches', value: 'All', icon: <Building2 size={14} />, color: 'text-text-muted' },
      ].map(({ label, value, icon, color }) => (
        <div
          key={label}
          className="bg-surface-card rounded-[16px] p-4 shadow-sm border border-border-subtle/30 flex flex-col"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
              {label}
            </p>
            <span className={color}>{icon}</span>
          </div>
          <p className="mt-2 text-[15px] font-black tracking-tight text-text-main">{value}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile Archive Card (Matches VehicleCard design)
// ─────────────────────────────────────────────────────────────────────────────
interface ArchiveCardProps {
  car: any;
  onClick: () => void;
}

const ArchiveCard: React.FC<ArchiveCardProps> = ({ car, onClick }) => (
  <div
    onClick={onClick}
    className="flex flex-col bg-surface-card rounded-[16px] overflow-hidden border border-border-subtle/30 shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
  >
    {/* Image */}
    <div className="relative w-full aspect-[4/3] bg-bg-secondary">
      <ProgressiveImage src={car.image} alt={car.name} className="w-full h-full" />

      {/* Status badge top-left */}
      <div className="absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[8px] font-bold shadow-sm uppercase border bg-rose-500/15 text-rose-400 border-rose-500/20">
        SOLD
      </div>

      {/* Heart top-right */}
      <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm">
        <Heart size={12} className="text-white" />
      </div>
    </div>

    {/* Details */}
    <div className="p-2.5 flex flex-col gap-1">
      <h4 className="text-[11px] font-bold text-text-main leading-tight truncate">
        {car.name}
      </h4>
      <p className="text-[9px] text-text-muted font-medium truncate">
        {car.soldDate} &bull; {car.branchName}
      </p>
      <div className="flex items-end justify-between mt-0.5">
        <p className="text-[13px] font-black text-success-main leading-none">
          +{(car.profit / 1000000).toFixed(2)}M
        </p>
      </div>
      {/* Margin pill */}
      <span className="self-start rounded-full px-2 py-0.5 text-[8px] font-bold border mt-1 bg-success-main/10 text-success-main border-success-main/20">
        {car.price > 0 ? ((car.profit / car.price) * 100).toFixed(1) : 0}% MARGIN
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile 2-column grid
// ─────────────────────────────────────────────────────────────────────────────
interface ArchiveGridProps {
  cars: any[];
  onClick: (id: string) => void;
}

const ArchiveGrid: React.FC<ArchiveGridProps> = ({ cars, onClick }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between px-1">
      <p className="text-[15px] font-black text-text-main">Sold Assets</p>
      <span className="text-[12px] font-bold text-primary-main">See all</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {cars.map((car) => (
        <ArchiveCard key={car.id} car={car} onClick={() => onClick(car.id)} />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Desktop Table
// ─────────────────────────────────────────────────────────────────────────────
interface ArchiveDesktopTableProps {
  archive: any[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const ArchiveDesktopTable: React.FC<ArchiveDesktopTableProps> = ({ archive, loading, onRowClick }) => (
  <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 transition-all duration-300 p-2 hidden md:block">
    <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
      <h2 className="text-[13px] font-bold text-text-main">Sales Ledger</h2>
      <p className="text-[12px] text-text-muted/60 font-medium">
        Profitability breakdown by vehicle
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-text-muted font-medium text-[13px]">
            <th className="pb-4 pt-6 px-4">Sold Asset</th>
            <th className="pb-4 pt-6 px-4">Sale Details</th>
            <th className="pb-4 pt-6 px-4">Financials</th>
            <th className="pb-4 pt-6 px-4 text-right">Profit Margin</th>
          </tr>
        </thead>
        <tbody className="space-y-4">
          {archive.map((car) => (
            <tr
              key={car.id}
              onClick={() => onRowClick(car.id)}
              className="group transition-all cursor-pointer"
            >
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-12 rounded-xl overflow-hidden border border-border-subtle/30 bg-bg-secondary shrink-0 shadow-sm">
                    <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-main font-bold text-sm tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                      {car.name}
                    </p>
                    <Badge variant="default" className="font-mono text-[12px] text-text-muted/60 border border-border-subtle/30 bg-bg-secondary">
                      {car.plate}
                    </Badge>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-text-muted/60">
                    <Calendar size={12} /> {car.soldDate}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-text-muted/60">
                    <Building2 size={12} /> {car.branchName}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 transition-all">
                <div className="space-y-1">
                  <p className="text-[13px] text-text-muted/60 font-medium">
                    Sale: {(car.price / 1000000).toFixed(2)}M ETB
                  </p>
                  <p className="text-[13px] text-error-main font-medium">
                    - Cost: {(car.unitCost / 1000000).toFixed(2)}M ETB
                  </p>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 transition-all">
                <div className="space-y-1 text-right">
                  <p className="text-xl font-black text-success-main tracking-tight">
                    +{(car.profit / 1000000).toFixed(2)}M
                  </p>
                  <Badge variant="success" className="bg-success-main/10 text-success-main border-none font-bold">
                    {car.price > 0 ? ((car.profit / car.price) * 100).toFixed(1) : 0}% Margin
                  </Badge>
                </div>
              </td>
            </tr>
          ))}
          {archive.length === 0 && !loading && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-text-muted">
                No sold vehicles found in the archive.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const SoldArchive = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const _cachedVehicles = apiCache.get('/vehicles_GET_""');
  const [archive, setArchive] = useState<any[]>(
    _cachedVehicles ? _cachedVehicles.filter((v: any) => v.status === 'SOLD').map((v: any) => ({
          id: v.id,
          name: `${v.year} ${v.make} ${v.model}`,
          price: Number(v.retail_price_etb) || 0,
          unitCost: Number(v.unit_cost) || 0,
          profit: (Number(v.retail_price_etb) || 0) - (Number(v.unit_cost) || 0),
          soldDate: v.sold_date ? new Date(v.sold_date).toLocaleDateString() : 'Unknown',
          branchName: v.branches?.name || 'Main Registry',
          image:
            (v.images && v.images.length > 0 ? v.images[0] : null) ||
            v.first_image_url ||
            'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop',
          plate: v.plate_code || v.plate_number || 'No Plate',
        })) : [],
  );
  const [loading, setLoading] = useState(!_cachedVehicles);

  const fetchArchive = () => {
    fetchWithCache('/vehicles', {}, (data) => {
      const dataArray = Array.isArray(data) ? data : [];
      const soldVehicles = dataArray
        .filter((v: any) => v.status === 'SOLD')
        .map((v: any) => ({
          id: v.id,
          name: `${v.year} ${v.make} ${v.model}`,
          price: Number(v.retail_price_etb) || 0,
          unitCost: Number(v.unit_cost) || 0,
          profit: (Number(v.retail_price_etb) || 0) - (Number(v.unit_cost) || 0),
          soldDate: v.sold_date ? new Date(v.sold_date).toLocaleDateString() : 'Unknown',
          branchName: v.branches?.name || 'Main Registry',
          image:
            (v.images && v.images.length > 0 ? v.images[0] : null) ||
            v.first_image_url ||
            'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop',
          plate: v.plate_code || v.plate_number || 'No Plate',
        }));
      setArchive(soldVehicles);
      setLoading(false);
    }).catch((err) => {
      console.error('[Sold Archive] Fetch Failed', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (session) {
      fetchArchive();
    }
  }, [session]);

  const totalRevenue = archive.reduce((sum, item) => sum + item.price, 0);
  const totalProfit = archive.reduce((sum, item) => sum + item.profit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* ─── DESKTOP STICKY HEADER ─── */}
      <div className="hidden md:block sticky top-0 z-30 -mx-4 md:-mx-8 -mt-5 md:-mt-8 border-b border-border-subtle/30 bg-bg-base/95 px-4 py-4 shadow-sm backdrop-blur-md md:px-8">
        <div className="rounded-[28px] border border-border-subtle/70 bg-surface-card/95 p-4 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
          <div className="flex items-center gap-3">
            <Archive size={22} className="text-primary-main" />
            <h1 className="text-xl font-black text-text-main tracking-tight">Sold Archive</h1>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP KPI GRID ─── */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Tooltip content="Total number of vehicles successfully sold">
          <KpiTile label="Units Sold" value={archive.length} icon={<Package size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Total gross revenue from vehicle sales">
          <KpiTile label="Gross Revenue" value={`${(totalRevenue / 1000000).toFixed(1)}M`} icon={<DollarSign size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Total net profit after unit costs">
          <KpiTile label="Net Profit" value={`${(totalProfit / 1000000).toFixed(2)}M`} icon={<DollarSign size={14} />} className="p-6 h-32 text-success-main" />
        </Tooltip>
        <Tooltip content="Average profit margin across all sales">
          <KpiTile label="Average Margin" value={`${avgMargin.toFixed(1)}%`} icon={<DollarSign size={14} />} className="p-6 h-32" />
        </Tooltip>
      </div>

      {/* ══════════════════════════════════════
          MOBILE SECTION
      ══════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-4">

        {/* ── Single sticky banner: ALL BRANCHES + Sales Ledger title ── */}
        <div className="sticky top-0 z-40 bg-bg-base -mx-4 px-4 pb-2">
          {/* Row 1: Branch label (set from Dashboard) */}
          <div className="h-[40px] flex items-center">
            <span className="text-text-main font-black uppercase tracking-wide text-[16px]">
              {localStorage.getItem('admin_selected_branch_name') || 'ALL BRANCHES'}
            </span>
          </div>
          {/* Row 2: Sales Ledger card */}
          <div className="bg-surface-card rounded-[16px] px-4 py-3 shadow-sm border border-border-subtle/30 flex items-center gap-3">
            <Archive size={20} className="text-[#1976d2] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black tracking-tight text-text-main">
                Sales Ledger
              </p>
              <p className="text-[10px] text-text-muted font-medium truncate">
                Profitability breakdown by vehicle
              </p>
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
        </div>

        {/* Mobile KPI cards */}
        <ArchiveKpis
          totalRevenue={totalRevenue}
          totalProfit={totalProfit}
          totalUnits={archive.length}
          avgMargin={avgMargin}
        />

        {/* 2-column vehicle grid */}
        <ArchiveGrid cars={archive} onClick={(id) => navigate(`/archive/${id}`)} />
      </div>

      {/* ─── DESKTOP TABLE ─── */}
      <ArchiveDesktopTable
        archive={archive}
        loading={loading}
        onRowClick={(id) => navigate(`/archive/${id}`)}
      />
    </div>
  );
};

export default SoldArchive;
