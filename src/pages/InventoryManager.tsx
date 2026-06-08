/**
 * InventoryManager.tsx
 *
 * Componentized for maintainability. Sub-components are defined at the
 * bottom of this file (MobileKpis, VehicleCard, VehicleGrid,
 * DesktopTable, DesktopSidebar, AssetFormModal).
 *
 * No functionality was removed.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  Image as ImageIcon,
  FileText,
  Settings,
  Zap,
  Building2,
  Package,
  LayoutGrid,
  Car,
  Printer,
  ChevronDown,
  ChevronRight,
  Heart,
  Network,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Tooltip } from '../components/ui/Tooltip';
import { TextField, SelectField } from '../components/ui/FormControls';
import { cn } from '../lib/utils';
import ImageUpload from '../components/ImageUpload';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { SalesReceipt } from '../components/documents/SalesReceipt';
import { ProgressiveImage } from '../components/ui/ProgressiveImage';

const ITEMS_PER_PAGE = 20;

/** Safely convert spaces to underscores without a regex literal */
function spaceToUnderscore(str: string): string {
  return str.split(' ').join('_');
}

/** Map a status string to a tailwind badge class set */
function getStatusStyle(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('SHOWROOM') || s.includes('AVAILABLE'))
    return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  if (s.includes('SOLD')) return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
  if (s.includes('SOURCING')) return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  return 'bg-bg-secondary text-text-muted border-border-subtle/30';
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile KPI cards
// ─────────────────────────────────────────────────────────────────────────────
interface MobileKpisProps {
  totalValue: number;
  inventoryCount: number;
  branchCount: number;
  archiveCount: number;
}

const MobileKpis: React.FC<MobileKpisProps> = ({
  totalValue,
  inventoryCount,
  branchCount,
  archiveCount,
}) => (
  <div className="flex flex-col gap-3">
    {/* Total Portfolio Value card with wave chart */}
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

    {/* 2×2 secondary KPI grid */}
    <div className="grid grid-cols-2 gap-3">
      {[
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
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Single vehicle card (mobile 2-col grid)
// ─────────────────────────────────────────────────────────────────────────────
interface VehicleCardProps {
  car: any;
  onOpen: () => void;
  onPrint: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ car, onOpen, onPrint }) => (
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

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Mobile 2-column vehicle grid
// ─────────────────────────────────────────────────────────────────────────────
interface VehicleGridProps {
  cars: any[];
  bottomRef: React.Ref<HTMLDivElement>;
  hasMore: boolean;
  onOpen: (car: any) => void;
  onPrint: (car: any) => void;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({
  cars,
  bottomRef,
  hasMore,
  onOpen,
  onPrint,
}) => (
  <div className="flex flex-col gap-3">
    {/* "Vehicles" header row */}
    <div className="flex items-center justify-between">
      <p className="text-[15px] font-black text-text-main">Vehicles</p>
      <span className="text-[12px] font-bold text-primary-main">See all</span>
    </div>

    {/* 2-column grid */}
    <div className="grid grid-cols-2 gap-3">
      {cars.map((car) => (
        <VehicleCard
          key={car.id}
          car={car}
          onOpen={() => onOpen(car)}
          onPrint={() => onPrint(car)}
        />
      ))}
    </div>

    {hasMore && <div ref={bottomRef} className="h-4 w-full" />}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Desktop table
// ─────────────────────────────────────────────────────────────────────────────
interface DesktopTableProps {
  cars: any[];
  onEdit: (car: any) => void;
  onDelete: (id: string) => void;
  onPrint: (car: any) => void;
}

const DesktopTable: React.FC<DesktopTableProps> = ({ cars, onEdit, onDelete, onPrint }) => (
  <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 p-2 hidden md:block">
    <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
      <h2 className="text-[13px] font-bold text-text-main">Registry Ledger</h2>
      <p className="text-[12px] text-text-muted/60 font-medium">
        Official documentation of vehicles across the branch network
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-text-muted font-medium text-[13px]">
            <th className="pb-4 pt-6 px-4">Unit Description</th>
            <th className="pb-4 pt-6 px-4">Registry Valuation</th>
            <th className="pb-4 pt-6 px-4">Branch Hub</th>
            <th className="pb-4 pt-6 px-4">Technical Dossier</th>
            <th className="pb-4 pt-6 px-4 text-right">Operational Status</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id} className="group transition-all">
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-12 rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                    <img
                      src={car.image}
                      alt={car.model}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {car.floorPlanLoan && (
                      <div className="absolute inset-0 border-2 border-warning rounded-xl" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-main font-bold text-sm tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                      {car.year} {car.make} {car.model}
                    </p>
                    <Tooltip content="System Registry ID">
                      <Badge
                        variant="default"
                        className="font-mono text-[12px] cursor-help bg-bg-secondary border border-border-subtle/30 text-text-muted/60"
                      >
                        ID: {car.id.substring(0, 8).toUpperCase()}
                      </Badge>
                    </Tooltip>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="space-y-1.5">
                  <p className="text-text-main font-bold text-sm tracking-tight leading-none">
                    {car.priceFormatted}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Tooltip content="Tax &amp; Import Status">
                      <Badge
                        variant={car.duty === 'DUTY PAID' ? 'primary' : 'warning'}
                        className="cursor-help"
                      >
                        {car.duty === 'DUTY PAID'
                          ? 'Tax Paid'
                          : car.duty === 'DUTY FREE'
                            ? 'Tax Exempt'
                            : car.duty}
                      </Badge>
                    </Tooltip>
                    {car.status === 'SHOWROOM' &&
                      Math.floor(
                        (new Date().getTime() - new Date(car.createdAt).getTime()) /
                          (1000 * 3600 * 24),
                      ) > 30 && (
                        <Tooltip content="Aged Inventory Alert">
                          <Badge
                            variant="error"
                            className="cursor-help bg-error-main/10 text-error-main border border-error-main/20"
                          >
                            Aged Stock
                          </Badge>
                        </Tooltip>
                      )}
                    {car.floorPlanLoan && (
                      <Tooltip
                        content={`Floor Plan Loan - Maturity: ${car.maturityDate || 'N/A'}`}
                      >
                        <Badge
                          variant="default"
                          className="cursor-help bg-warning/10 text-warning border border-warning/20"
                        >
                          On Credit
                        </Badge>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <Tooltip content="Current Physical Location">
                  <div className="flex items-center gap-2 text-text-muted/60 text-[13px] font-bold bg-bg-secondary/50 px-3 py-2 rounded-xl border border-border-subtle/30 group-hover:border-primary-main/20 transition-all w-fit cursor-help">
                    <Building2 size={12} className="text-primary-main/30" /> {car.branchName}
                  </div>
                </Tooltip>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center gap-2">
                  <Tooltip
                    content={car.gallery.length > 0 ? 'View Asset Photos' : 'No Photos Uploaded'}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-xl border transition-all shadow-sm',
                        car.gallery.length > 0
                          ? 'bg-primary-main/10 text-primary-main border-primary-main/20'
                          : 'bg-bg-secondary text-text-muted/10 border-border-subtle/30',
                      )}
                    >
                      <ImageIcon size={14} />
                    </div>
                  </Tooltip>
                  <Tooltip
                    content={
                      car.internalDocuments.length > 0
                        ? 'View Technical Docs'
                        : 'No Docs Uploaded'
                    }
                  >
                    <div
                      className={cn(
                        'p-2 rounded-xl border transition-all shadow-sm',
                        car.internalDocuments.length > 0
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-bg-secondary text-text-muted/10 border-border-subtle/30',
                      )}
                    >
                      <FileText size={14} />
                    </div>
                  </Tooltip>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <Tooltip content="Print Sales Receipt">
                    <button
                      className="w-10 h-10 flex items-center justify-center bg-bg rounded-xl text-text-muted hover:text-primary-main border border-border-subtle shadow-sm transition-all active:scale-90"
                      onClick={() => onPrint(car)}
                    >
                      <Printer size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Modify Asset Registry">
                    <button
                      className="w-10 h-10 flex items-center justify-center bg-bg-secondary rounded-xl text-text-muted/60 hover:text-primary-main border border-border-subtle/30 shadow-sm transition-all active:scale-90"
                      onClick={() => onEdit(car)}
                    >
                      <Edit2 size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Remove Asset from Registry">
                    <button
                      className="w-10 h-10 flex items-center justify-center bg-bg-secondary rounded-xl text-text-muted/60 hover:text-error-main border border-border-subtle/30 shadow-sm transition-all active:scale-90"
                      onClick={() => onDelete(car.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Desktop sidebar
// ─────────────────────────────────────────────────────────────────────────────
interface DesktopSidebarProps {
  totalValue: number;
  branchCount: number;
  onAdd: () => void;
  onRefresh: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  totalValue,
  branchCount,
  onAdd,
  onRefresh,
}) => (
  <aside className="hidden space-y-6 xl:block">
    <div className="rounded-[30px] border border-border-subtle/70 bg-surface-card/95 p-5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        Control Center
      </p>
      <h3 className="mt-2 text-lg font-black tracking-tight text-text-main">Branch Overview</h3>
      <p className="mt-2 text-[13px] text-text-muted/80">
        Manage your entire vehicle portfolio from one unified control point.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border-subtle/60 bg-bg-secondary/60 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Total Value
          </p>
          <p className="mt-1 text-lg font-black text-text-main">
            {(totalValue / 1000000).toFixed(1)}M ETB
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle/60 bg-bg-secondary/60 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Active Hubs
          </p>
          <p className="mt-1 text-lg font-black text-text-main">{branchCount}</p>
        </div>
      </div>
    </div>

    <div className="rounded-[30px] border border-border-subtle/70 bg-surface-card/95 p-5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        Quick Actions
      </p>
      <div className="mt-4 space-y-3">
        <Button
          variant="primary"
          className="h-12 w-full shadow-lg shadow-primary-main/20"
          onClick={onAdd}
        >
          <Plus size={16} className="mr-2" /> Register Asset
        </Button>
        <Button variant="outline" className="h-12 w-full" onClick={onRefresh}>
          Refresh Registry
        </Button>
      </div>
    </div>
  </aside>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Asset form modal
// ─────────────────────────────────────────────────────────────────────────────
interface AssetFormModalProps {
  isOpen: boolean;
  editingId: string | null;
  formData: any;
  setFormData: (d: any) => void;
  activeTab: string;
  setActiveTab: (t: any) => void;
  branches: any[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  editingId,
  formData,
  setFormData,
  activeTab,
  setActiveTab,
  branches,
  onClose,
  onSubmit,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={editingId ? 'Edit Asset Registry' : 'New Asset Registration'}
    subtitle="Regional vehicle inventory and technical archives."
    maxWidth="max-w-4xl"
    footer={
      <>
        <Button variant="outline" className="flex-1 h-12" onClick={onClose}>
          Cancel Operation
        </Button>
        <Button
          variant="primary"
          className="flex-1 h-12 shadow-lg shadow-primary-main/20"
          onClick={(e) => onSubmit(e as any)}
        >
          {editingId ? 'Commit Asset Changes' : 'Finalize Registry Entry'}
        </Button>
      </>
    }
  >
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-bg-secondary/50 p-1.5 rounded-2xl border border-border-subtle/30 shrink-0">
        {[
          { id: 'core', label: 'Core Registry', icon: <Package size={14} /> },
          { id: 'specs', label: 'Specifications', icon: <Settings size={14} /> },
          { id: 'gallery', label: 'Asset Gallery', icon: <ImageIcon size={14} /> },
          { id: 'financials', label: 'Financials', icon: <Zap size={14} /> },
          { id: 'archives', label: 'Internal Archives', icon: <FileText size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-all rounded-xl whitespace-nowrap shrink-0',
              activeTab === tab.id
                ? 'bg-surface-card text-primary-main shadow-sm border border-border-subtle/30'
                : 'text-text-muted/60 hover:text-text-main hover:bg-bg-secondary',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto mt-4 px-1 pb-4">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* ── CORE ── */}
          {activeTab === 'core' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <TextField
                label="Make"
                value={formData.make}
                onChange={(v) => setFormData({ ...formData, make: v })}
                placeholder="e.g. Toyota"
              />
              <TextField
                label="Model"
                value={formData.model}
                onChange={(v) => setFormData({ ...formData, model: v })}
                placeholder="e.g. bZ4X"
              />
              <TextField
                label="Year"
                type="number"
                value={formData.year}
                onChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
              />
              <TextField
                label="Retail Price (ETB)"
                type="number"
                value={formData.retailPrice}
                onChange={(v) => setFormData({ ...formData, retailPrice: parseInt(v) })}
              />
              <SelectField
                label="Fuel Type"
                value={formData.fuelType}
                onChange={(v) => setFormData({ ...formData, fuelType: v })}
                options={['ELECTRIC', 'PETROL', 'HYBRID']}
              />
              <SelectField
                label="Duty Status"
                value={formData.dutyStatus}
                onChange={(v) => setFormData({ ...formData, dutyStatus: v })}
                options={['DUTY_PAID', 'DUTY_FREE']}
              />
              <TextField
                label="Plate"
                value={formData.plate}
                onChange={(v) => setFormData({ ...formData, plate: v })}
              />
              <TextField
                label="VIN"
                value={formData.vin}
                onChange={(v) => setFormData({ ...formData, vin: v })}
              />
              <SelectField
                label="Regional Hub"
                value={formData.branchId}
                onChange={(v) => setFormData({ ...formData, branchId: v })}
                options={branches.map((b) => ({ label: b.name, value: b.id }))}
              />
              <SelectField
                label="System Status"
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v })}
                options={['SOURCING', 'SHOWROOM', 'SOLD']}
              />
              <TextField
                label="Certified KM"
                type="number"
                value={formData.certifiedKm}
                onChange={(v) => setFormData({ ...formData, certifiedKm: v })}
                placeholder="e.g. 12000"
              />
            </div>
          )}

          {/* ── SPECS ── */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Electric Powertrain
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <TextField
                    label="Battery (kWh)"
                    value={formData.specifications.batteryKwh}
                    onChange={(v) =>
                      setFormData({
                        ...formData,
                        specifications: { ...formData.specifications, batteryKwh: v },
                      })
                    }
                  />
                  <TextField
                    label="Range (km)"
                    value={formData.specifications.range}
                    onChange={(v) =>
                      setFormData({
                        ...formData,
                        specifications: { ...formData.specifications, range: v },
                      })
                    }
                  />
                </div>
                <TextField
                  label="Motor Power"
                  value={formData.specifications.motorPower}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, motorPower: v },
                    })
                  }
                />
              </div>
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Chassis &amp; Interior
                </p>
                <SelectField
                  label="Drive Train"
                  value={formData.specifications.driveTrain}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, driveTrain: v },
                    })
                  }
                  options={['RWD', 'AWD', 'FWD']}
                />
                <TextField
                  label="Interior Color"
                  value={formData.specifications.interiorColor}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, interiorColor: v },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* ── GALLERY ── */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 md:space-y-10">
              <ImageUpload
                bucket="vehicles"
                folder="gallery"
                maxFiles={12}
                onUploadComplete={(urls) =>
                  setFormData((prev: any) => ({ ...prev, gallery: [...prev.gallery, ...urls] }))
                }
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {formData.gallery.map((url: string, i: number) => (
                  <div
                    key={i}
                    className="relative aspect-video rounded-2xl overflow-hidden border border-border-subtle bg-bg-secondary shadow-sm group/img"
                  >
                    <img src={url} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          gallery: formData.gallery.filter((_: any, idx: number) => idx !== i),
                        })
                      }
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-error-main text-white rounded-xl opacity-0 group-hover/img:opacity-100 transition-all shadow-lg scale-90 group-hover/img:scale-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FINANCIALS ── */}
          {activeTab === 'financials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Costing &amp; Sales
                </p>
                <TextField
                  label="True Unit Cost (ETB)"
                  type="number"
                  value={formData.unitCost}
                  onChange={(v) => setFormData({ ...formData, unitCost: v })}
                  placeholder="Include purchase + reconditioning"
                />
                <TextField
                  label="Sold Date"
                  type="date"
                  value={formData.soldDate}
                  onChange={(v) => setFormData({ ...formData, soldDate: v })}
                />
              </div>
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Floor Plan Management
                </p>
                <div className="flex items-center gap-3 py-2 md:py-4">
                  <input
                    type="checkbox"
                    id="floorPlan"
                    checked={formData.floorPlanLoan}
                    onChange={(e) =>
                      setFormData({ ...formData, floorPlanLoan: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-border-subtle/30 text-primary-main focus:ring-primary-main"
                  />
                  <label htmlFor="floorPlan" className="text-sm font-bold text-text-main">
                    Vehicle is on Floor Plan / Credit
                  </label>
                </div>
                {formData.floorPlanLoan && (
                  <TextField
                    label="Maturity / Payment Deadline"
                    type="date"
                    value={formData.maturityDate}
                    onChange={(v) => setFormData({ ...formData, maturityDate: v })}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── ARCHIVES ── */}
          {activeTab === 'archives' && (
            <div className="space-y-6 md:space-y-8">
              <ImageUpload
                bucket="vehicles"
                folder="documents"
                label="Upload Technical Dossiers"
                onUploadComplete={(urls) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    internalDocuments: [...prev.internalDocuments, ...urls],
                  }))
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {formData.internalDocuments.map((doc: any, i: number | string) => (
                  <div
                    key={i}
                    className="bg-bg-secondary/50 border border-border-subtle/30 p-6 rounded-3xl flex items-center justify-between group/doc hover:bg-bg-secondary/80 hover:border-primary-main/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div className="bg-warning/10 border border-warning/20 w-12 h-12 rounded-2xl flex items-center justify-center text-warning shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[13px] font-bold text-text-main line-clamp-1">
                          {typeof doc === 'string' ? doc.split('/').pop() : doc.name}
                        </p>
                        <p className="text-[13px] text-text-muted/40 font-bold uppercase tracking-wider">
                          Internal Resource
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          window.open(typeof doc === 'string' ? doc : doc.url, '_blank')
                        }
                        className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-xl text-text-muted/60 hover:text-primary-main shadow-sm transition-all active:scale-90"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            internalDocuments: formData.internalDocuments.filter(
                              (_: any, idx: number) => idx !== i,
                            ),
                          })
                        }
                        className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-xl text-error-main hover:bg-error-main/5 hover:border-error-main/20 shadow-sm transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const InventoryManager = () => {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<
    'core' | 'specs' | 'gallery' | 'financials' | 'archives'
  >('core');
  const [isAdding, setIsAdding] = useState(false);
  const [printReceiptOpen, setPrintReceiptOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<any>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    retailPrice: '',
    fuelType: 'ELECTRIC',
    dutyStatus: 'DUTY_PAID',
    plate: '',
    vin: '',
    branchId: '',
    status: 'SOURCING',
    certifiedKm: '',
    specifications: {
      batteryKwh: '',
      range: '',
      motorPower: '',
      driveTrain: 'RWD',
      interiorColor: 'Black',
      features: [],
    },
    gallery: [],
    internalDocuments: [],
    unitCost: '',
    floorPlanLoan: false,
    maturityDate: '',
    soldDate: '',
  });

  const filteredInventory = inventory.filter((car) => {
    const searchStr =
      `${car.make} ${car.model} ${car.year} ${car.plate} ${car.status}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  const displayedInventory = filteredInventory.slice(0, displayCount);

  // Infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && displayCount < filteredInventory.length) {
        setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
      }
    },
    [displayCount, filteredInventory.length],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  const fetchBranches = async () => {
    try {
      const data = await api.get<any[]>('/locations');
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Inventory] Branch Fetch Failed', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const data = await api.get<any[]>('/vehicles');
      const dataArray = Array.isArray(data) ? data : [];
      const mapped = dataArray.map((v: any) => ({
        id: v.id,
        make: v.make || 'Unknown',
        model: v.model || 'Model',
        year: v.year || new Date().getFullYear(),
        priceFormatted: v.retail_price_etb
          ? `ETB ${(Number(v.retail_price_etb) / 1000000).toFixed(1)}M`
          : 'Price TBD',
        rawPrice: v.retail_price_etb || 0,
        fuel: v.fuel || v.fuel_type || 'N/A',
        plate: v.plate_code || v.plate_number || 'No Plate',
        status: String(v.status || 'UNKNOWN').split('_').join(' '),
        duty: String(v.duty || v.duty_status || 'UNKNOWN').split('_').join(' '),
        branchName: v.branches?.name || 'Main Registry',
        branchId: v.branch_id,
        image:
          Array.isArray(v.gallery) && v.gallery.length > 0
            ? v.gallery[0]
            : Array.isArray(v.images) && v.images.length > 0
              ? v.images[0]
              : v.first_image_url ||
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop',
        specifications: {
          batteryKwh: v.battery_capacity_kwh || '',
          range: v.range_km || '',
          motorPower: v.motor_power_kw || '',
          driveTrain: v.drive_train || 'RWD',
          interiorColor: v.interior_color || 'Black',
          features: v.features || [],
        },
        gallery: Array.isArray(v.gallery) ? v.gallery : Array.isArray(v.images) ? v.images : [],
        certifiedKm: v.certified_km || null,
        internalDocuments: Array.isArray(v.internal_documents) ? v.internal_documents : [],
        unitCost: v.unit_cost || 0,
        floorPlanLoan: v.floor_plan_loan || false,
        maturityDate: v.maturity_date
          ? new Date(v.maturity_date).toISOString().split('T')[0]
          : '',
        soldDate: v.sold_date ? new Date(v.sold_date).toISOString().split('T')[0] : '',
        createdAt: v.created_at || new Date().toISOString(),
      }));
      setInventory(mapped);
    } catch (err) {
      console.error('[Inventory] Fetch Failed', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchInventory();
      fetchBranches();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const toNum = (val: any): number | undefined => {
      if (val === '' || val === null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    };

    const payload: any = {
      make: formData.make,
      model: formData.model,
      year: Number(formData.year),
      retail_price_etb: Number(formData.retailPrice),
      fuel: formData.fuelType,
      duty: formData.dutyStatus,
      battery_soh_percent: toNum(formData.specifications?.batteryKwh),
      plate_code: formData.plate,
      vin_chassis: formData.vin,
      status: formData.status,
      certified_km: toNum(formData.certifiedKm),
      range_km: toNum(formData.specifications?.range),
      motor_power_kw: toNum(formData.specifications?.motorPower),
      drive_train: formData.specifications?.driveTrain,
      interior_color: formData.specifications?.interiorColor,
      battery_capacity_kwh: toNum(formData.specifications?.batteryKwh),
      unit_cost: toNum(formData.unitCost) ?? 0,
      floor_plan_loan: formData.floorPlanLoan ? 1 : 0,
      maturity_date: formData.maturityDate || null,
      sold_date: formData.sold_date || null,
    };

    if (Array.isArray(formData.gallery) && formData.gallery.length > 0) {
      const validImages = formData.gallery.filter(
        (url: any) => typeof url === 'string' && url.trim().length > 0,
      );
      if (validImages.length > 0) payload.images = validImages;
    }

    if (formData.specifications?.features && formData.specifications.features.length > 0) {
      payload.features = formData.specifications.features.filter(
        (f: any) => typeof f === 'string' && f.trim().length > 0,
      );
    }

    if (
      typeof formData.branchId === 'string' &&
      isUUID(formData.branchId) &&
      !formData.branchId.startsWith('66666666')
    ) {
      payload.branch_id = formData.branchId;
    }

    try {
      if (editingId) {
        await api.patch(`/vehicles/${editingId}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      setIsAdding(false);
      setEditingId(null);
      resetForm();
      fetchInventory();
    } catch (err) {
      console.error('[Inventory] Save Failed', err);
    }
  };

  const resetForm = () => {
    const defaultBranchId =
      session?.profile?.role === 'GENERAL_MANAGER'
        ? branches[0]?.id || ''
        : session?.profile?.branch_id || '';

    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      retailPrice: '',
      fuelType: 'ELECTRIC',
      dutyStatus: 'DUTY_PAID',
      plate: '',
      vin: '',
      branchId: defaultBranchId,
      status: 'SOURCING',
      certifiedKm: '',
      specifications: {
        batteryKwh: '',
        range: '',
        motorPower: '',
        driveTrain: 'RWD',
        interiorColor: 'Black',
        features: [],
      },
      gallery: [],
      internalDocuments: [],
      unitCost: '',
      floorPlanLoan: false,
      maturityDate: '',
      soldDate: '',
    });
  };

  const handleDelete = async (carId: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${carId}`);
      fetchInventory();
    } catch (err) {
      console.error('[Inventory] Delete Failed', err);
    }
  };

  const openEdit = (car: any) => {
    setEditingId(car.id);
    setFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      retailPrice: car.rawPrice,
      fuelType: car.fuel,
      dutyStatus: spaceToUnderscore(String(car.duty || '')).toUpperCase(),
      plate: car.plate,
      vin: car.id,
      specifications: car.specifications || {},
      branchId: car.branchId,
      status: spaceToUnderscore(String(car.status || 'SOURCING')).toUpperCase(),
      certifiedKm: car.certifiedKm || '',
      gallery: car.gallery || [],
      internalDocuments: car.internalDocuments || [],
      unitCost: car.unitCost,
      floorPlanLoan: car.floorPlanLoan,
      maturityDate: car.maturityDate,
      soldDate: car.soldDate,
    });
    setIsAdding(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setIsAdding(true);
  };

  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.rawPrice) || 0), 0);

  const archiveCount = inventory.reduce(
    (s, v) => s + (Array.isArray(v.internalDocuments) ? v.internalDocuments.length : 0),
    0,
  );

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* ─── DESKTOP STICKY HEADER ─── */}
      <div className="hidden md:block sticky top-0 z-30 -mx-4 md:-mx-8 -mt-5 md:-mt-8 border-b border-border-subtle/30 bg-bg-base/95 px-4 py-4 shadow-sm backdrop-blur-md md:px-8">
        <div className="rounded-[28px] border border-border-subtle/70 bg-surface-card/95 p-4 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LayoutGrid size={22} className="text-primary-main" />
              <h1 className="text-xl font-black text-text-main tracking-tight">Asset Registry</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group w-64">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30 group-focus-within:text-primary-main transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams);
                    if (e.target.value) newParams.set('q', e.target.value);
                    else newParams.delete('q');
                    setSearchParams(newParams, { replace: true });
                  }}
                  className="w-full rounded-2xl border border-border-subtle/30 bg-bg-secondary py-3 pl-11 pr-4 text-[13px] font-semibold text-text-main shadow-sm transition-all placeholder:text-text-muted/30 focus:border-primary-main/30 focus:outline-none focus:ring-4 focus:ring-primary-main/5"
                />
              </div>
              <Button
                variant="primary"
                className="h-11 px-6 shadow-lg shadow-primary-main/20 shrink-0 text-sm font-bold whitespace-nowrap"
                onClick={openAdd}
              >
                <Plus size={16} className="mr-2" /> Register Asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP KPI GRID ─── */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Tooltip content="Total number of vehicles in active registry">
          <KpiTile label="Inventory" value={inventory.length} icon={<Package size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Estimated market value of all registered assets">
          <KpiTile label="Portfolio Value" value={`${(totalValue / 1000000).toFixed(1)}M ETB`} icon={<Zap size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Total internal technical documents archived">
          <KpiTile label="Archives" value={archiveCount} icon={<FileText size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Active branch hubs reporting inventory">
          <KpiTile label="Active Hubs" value={branches.length} icon={<Building2 size={14} />} className="p-6 h-32" />
        </Tooltip>
      </div>

      {/* ─── MAIN CONTENT GRID ─── */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">

          {/* ══════════ MOBILE SECTION ══════════ */}
          <div className="md:hidden flex flex-col gap-4">

            {/* ── Single sticky banner: ALL BRANCHES + Ledger title ── */}
            <div className="sticky top-0 z-40 bg-bg-base -mx-4 px-4 pb-2">
            {/* Row 1: Branch label (set from Dashboard) */}
              <div className="h-[40px] flex items-center">
                <span className="text-text-main font-black uppercase tracking-wide text-[16px]">
                  {localStorage.getItem('admin_selected_branch_name') || 'ALL BRANCHES'}
                </span>
              </div>
              {/* Row 2: Registry Ledger card — flush below, no gap */}
              <div className="bg-surface-card rounded-[16px] px-4 py-3 shadow-sm border border-border-subtle/30 flex items-center gap-3">
                <Car size={20} className="text-[#1976d2] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black tracking-tight text-text-main">
                    Registry Ledger
                  </p>
                  <p className="text-[10px] text-text-muted font-medium truncate">
                    Official documentation of vehicles across the branch network
                  </p>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </div>
            </div>

            {/* Mobile KPI cards */}
            <MobileKpis
              totalValue={totalValue}
              inventoryCount={inventory.length}
              branchCount={branches.length}
              archiveCount={archiveCount}
            />

            {/* 2-column vehicle grid */}
            <VehicleGrid
              cars={displayedInventory}
              bottomRef={bottomRef}
              hasMore={displayCount < filteredInventory.length}
              onOpen={openEdit}
              onPrint={(car) => {
                setSelectedAsset(car);
                setPrintReceiptOpen(true);
              }}
            />
          </div>

          {/* ══════════ DESKTOP TABLE ══════════ */}
          <DesktopTable
            cars={filteredInventory}
            onEdit={openEdit}
            onDelete={handleDelete}
            onPrint={(car) => {
              setSelectedAsset(car);
              setPrintReceiptOpen(true);
            }}
          />
        </div>

        {/* ─── DESKTOP SIDEBAR ─── */}
        <DesktopSidebar
          totalValue={totalValue}
          branchCount={branches.length}
          onAdd={openAdd}
          onRefresh={fetchInventory}
        />
      </div>

      {/* ─── MOBILE FAB "+" BUTTON ─── */}
      <button
        onClick={openAdd}
        className="md:hidden fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full shadow-[0_18px_45px_-18px_rgba(15,23,42,0.75)] backdrop-blur-2xl bg-white/70 border border-white/25 text-primary-main flex items-center justify-center active:scale-90 transition-transform dark:bg-white/10 dark:border-white/10 dark:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.92)]"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* ─── ASSET FORM MODAL ─── */}
      <AssetFormModal
        isOpen={isAdding}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branches={branches}
        onClose={() => {
          resetForm();
          setIsAdding(false);
        }}
        onSubmit={handleSubmit}
      />

      {/* ─── DOCUMENT VIEWER (Print Receipt) ─── */}
      {selectedAsset && (
        <DocumentViewer
          isOpen={printReceiptOpen}
          onClose={() => setPrintReceiptOpen(false)}
          title={`Sales Receipt - ${selectedAsset.make} ${selectedAsset.model}`}
        >
          <SalesReceipt
            transaction={{
              id: selectedAsset.id,
              price: selectedAsset.rawPrice,
              buyerName: 'Walk-in Customer',
              buyerPhone: 'N/A',
              buyerAddress: 'Addis Ababa, Ethiopia',
              vehicle: {
                make: selectedAsset.make,
                model: selectedAsset.model,
                year: selectedAsset.year,
                vin: selectedAsset.plate,
                condition: 'Used',
                mileage: selectedAsset.certifiedKm || 0,
              },
            }}
            date={new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </DocumentViewer>
      )}
    </div>
  );
};

export default InventoryManager;
