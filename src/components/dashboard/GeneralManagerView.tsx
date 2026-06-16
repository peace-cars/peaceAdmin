import React, { useState, useMemo } from 'react';
import {
  LineChart, Wallet, Building2, Calculator, Shield, User, CarFront, Users,
  CheckCircle2, BarChart2, LayoutDashboard, TrendingUp, TrendingDown,
} from 'lucide-react';
import { KpiTile } from '../ui/KpiTile';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { SkeletonKpi, SkeletonCard } from '../ui/Skeleton';

interface GeneralManagerViewProps {
  loadingMetrics: boolean;
  totalNetProfit: number;
  pendingCommissions: number;
  branchCount: number;
  exchangeRate: string;
  tradeIns: any[];
  districtOverview?: any[];
  dmBranches?: any[];
  budgets?: any[];
  branchStaff?: any[];
  selectedBranchId?: string;
  profitability?: any[];
  onUpdateExchangeRate: () => void;
  onApproveListing: (id: string, price: number) => void;
  onApprove: (id: string, price: number) => void;
  onReject: (id: string, reason: string) => void;
  onViewReport: (lead: any) => void;
  isSubmitting?: boolean;
}

// ─── Tiny SVG line chart ───────────────────────────────────────────────────
function LineChartSVG({ data, color = '#2196f3' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 400;
  const H = 120;
  const pad = 16;
  const step = (W - pad * 2) / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => ({
    x: pad + i * step,
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${points.map(p => `${p.x},${p.y}`).join(' ')} ${points[points.length - 1].x},${H} ${points[0].x},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lineGrad)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} strokeWidth="2" stroke="white" />
      ))}
    </svg>
  );
}

// ─── Tiny SVG bar chart ────────────────────────────────────────────────────
function BarChartSVG({ labels, values, color = '#2196f3' }: { labels: string[]; values: number[]; color?: string }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const W = 400;
  const H = 110;
  const pad = { x: 8, y: 12 };
  const barW = Math.max(8, Math.floor((W - pad.x * 2) / values.length) - 6);
  const gap = (W - pad.x * 2 - barW * values.length) / Math.max(values.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      {values.map((v, i) => {
        const barH = Math.max(4, (v / max) * (H - pad.y * 2));
        const x = pad.x + i * (barW + gap);
        const y = H - pad.y - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} fillOpacity={i % 2 === 0 ? 0.85 : 0.55} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Month names helper ────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const GeneralManagerView: React.FC<GeneralManagerViewProps> = ({
  loadingMetrics,
  totalNetProfit,
  pendingCommissions,
  branchCount,
  exchangeRate,
  tradeIns,
  districtOverview = [],
  dmBranches = [],
  budgets = [],
  branchStaff = [],
  selectedBranchId = 'ALL',
  profitability = [],
  onUpdateExchangeRate,
  onApproveListing,
  onApprove,
  onReject,
  onViewReport,
  isSubmitting,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'charts'>('cards');

  // Filter by branch when a specific branch is selected
  const branchFilteredLeads = selectedBranchId === 'ALL'
    ? tradeIns
    : tradeIns.filter(t => t.branch_id === selectedBranchId || t.locationId === selectedBranchId);
  const escalatedLeads = branchFilteredLeads.filter(t => t.status === 'ESCALATED_TO_GM' || t.status === 'MANAGER_REVIEW');

  // ── Chart data derived from real profitability records ──────────────────
  const monthlyProfitData = useMemo(() => {
    const buckets: Record<string, number> = {};
    profitability.forEach((p: any) => {
      if (!p.soldDate) return;
      const d = new Date(p.soldDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets[key] = (buckets[key] || 0) + (Number(p.netProfit) || 0);
    });

    // Last 6 months
    const result: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result.push({ label: MONTHS[d.getMonth()], value: buckets[key] || 0 });
    }
    return result;
  }, [profitability]);

  const monthlySalesCountData = useMemo(() => {
    const buckets: Record<string, number> = {};
    profitability.forEach((p: any) => {
      if (!p.soldDate) return;
      const d = new Date(p.soldDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const result: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result.push({ label: MONTHS[d.getMonth()], value: buckets[key] || 0 });
    }
    return result;
  }, [profitability]);

  // Branch performance from districtOverview or fallback from profitability
  const branchPerfData = useMemo(() => {
    if (districtOverview.length > 0) {
      return districtOverview.slice(0, 6).map((d: any) => ({
        label: d.district_name || d.name || 'Branch',
        value: Number(d.total_revenue) || Number(d.revenue) || 0,
        units: Number(d.total_units) || Number(d.units) || 0,
      }));
    }
    // Fallback: aggregate from profitability per branch
    const byBranch: Record<string, { label: string; value: number; units: number }> = {};
    profitability.forEach((p: any) => {
      const name = p.branchName || 'Unknown';
      if (!byBranch[name]) byBranch[name] = { label: name, value: 0, units: 0 };
      byBranch[name].value += Number(p.netProfit) || 0;
      byBranch[name].units += 1;
    });
    return Object.values(byBranch).slice(0, 6);
  }, [districtOverview, profitability]);

  // Summary stats for chart mode
  const totalSold = profitability.length;
  const avgMargin = totalSold > 0
    ? profitability.reduce((s: number, p: any) => s + (Number(p.margin) || 0), 0) / totalSold
    : 0;
  const bestMonth = monthlyProfitData.reduce((a, b) => b.value > a.value ? b : a, { label: '—', value: 0 });

  if (loadingMetrics) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SkeletonKpi className="h-28" />
          <SkeletonKpi className="h-28" />
          <SkeletonKpi className="h-28" />
          <SkeletonKpi className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── View Mode Toggle ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-bg-secondary/60 border border-border-subtle/30 rounded-[14px] p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all',
              viewMode === 'cards'
                ? 'bg-surface-card text-primary-main shadow-sm border border-border-subtle/30'
                : 'text-text-muted/60 hover:text-text-main',
            )}
          >
            <LayoutDashboard size={13} /> Card View
          </button>
          <button
            onClick={() => setViewMode('charts')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all',
              viewMode === 'charts'
                ? 'bg-surface-card text-primary-main shadow-sm border border-border-subtle/30'
                : 'text-text-muted/60 hover:text-text-main',
            )}
          >
            <BarChart2 size={13} /> Chart View
          </button>
        </div>
        {viewMode === 'charts' && profitability.length === 0 && (
          <span className="text-[11px] text-text-muted/50 font-medium">
            Charts populate as sales are recorded
          </span>
        )}
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          label="Portfolio Revenue"
          value={`${(totalNetProfit / 1000000).toFixed(1)}M`}
          icon={<LineChart size={18} />}
          delta={12}
          deltaType="increase"
        />
        <KpiTile
          label="Settlement Pending"
          value={`${(pendingCommissions / 1000).toFixed(1)}K`}
          icon={<Wallet size={18} />}
          color="amber"
        />
        <KpiTile
          label="Active Hubs"
          value={branchCount}
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

      {/* ══════════════════════════════════════════════════════════════════
          CHART VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'charts' && (
        <div className="space-y-6 animate-fade-in">

          {/* Summary stat row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Units Sold', value: totalSold, sub: 'all time', icon: <CarFront size={14} />, color: 'text-primary-main bg-primary-main/10' },
              { label: 'Avg Margin', value: `${avgMargin.toFixed(1)}%`, sub: 'across all sales', icon: <TrendingUp size={14} />, color: 'text-success bg-success/10' },
              { label: 'Best Month', value: bestMonth.label, sub: bestMonth.value > 0 ? `${(bestMonth.value / 1_000_000).toFixed(1)}M ETB` : 'No data yet', icon: <BarChart2 size={14} />, color: 'text-amber-400 bg-amber-500/10' },
            ].map(item => (
              <div key={item.label} className="bg-surface-card border border-border-subtle/30 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                  {item.icon}
                </div>
                <p className="text-xl font-black text-text-main tracking-tight leading-none">{item.value}</p>
                <p className="text-[11px] text-text-muted font-medium">{item.label}</p>
                <p className="text-[10px] text-text-muted/50">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Monthly Profit Trend */}
          <div className="bg-surface-card border border-border-subtle/30 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted/60">Trend</p>
                <h3 className="text-[15px] font-black text-text-main mt-0.5">Monthly Net Profit</h3>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-success font-bold">
                <TrendingUp size={14} /> ETB
              </div>
            </div>

            {/* Month labels */}
            <div className="flex justify-between px-6 mb-1">
              {monthlyProfitData.map(m => (
                <span key={m.label} className="text-[10px] font-bold text-text-muted/50 text-center w-12">{m.label}</span>
              ))}
            </div>

            <div className="px-4 pb-2">
              <LineChartSVG data={monthlyProfitData.map(m => m.value)} color="#22c55e" />
            </div>

            {/* Value labels */}
            <div className="flex justify-between px-6 pb-5">
              {monthlyProfitData.map(m => (
                <span key={m.label} className="text-[9px] font-bold text-text-muted/40 text-center w-12">
                  {m.value > 0 ? `${(m.value / 1_000_000).toFixed(1)}M` : '—'}
                </span>
              ))}
            </div>
          </div>

          {/* Units Sold per Month + Branch Performance side-by-side */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* Units / Month bar chart */}
            <div className="bg-surface-card border border-border-subtle/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 pt-5 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted/60">Volume</p>
                <h3 className="text-[14px] font-black text-text-main mt-0.5">Units Sold / Month</h3>
              </div>
              <div className="flex justify-between px-5 mb-1">
                {monthlySalesCountData.map(m => (
                  <span key={m.label} className="text-[9px] font-bold text-text-muted/50 w-12 text-center">{m.label}</span>
                ))}
              </div>
              <div className="px-4 pb-2">
                <BarChartSVG
                  labels={monthlySalesCountData.map(m => m.label)}
                  values={monthlySalesCountData.map(m => m.value)}
                  color="#2196f3"
                />
              </div>
              <div className="flex justify-between px-5 pb-4">
                {monthlySalesCountData.map(m => (
                  <span key={m.label} className="text-[9px] font-bold text-text-muted/40 w-12 text-center">
                    {m.value > 0 ? m.value : '—'}
                  </span>
                ))}
              </div>
            </div>

            {/* Branch Revenue bar chart */}
            <div className="bg-surface-card border border-border-subtle/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 pt-5 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted/60">Branches</p>
                <h3 className="text-[14px] font-black text-text-main mt-0.5">Revenue by Branch</h3>
              </div>
              {branchPerfData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted/30">
                  <BarChart2 size={28} className="mb-2" />
                  <p className="text-[12px] font-medium">No branch data yet</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between px-5 mb-1">
                    {branchPerfData.map(b => (
                      <span key={b.label} className="text-[8px] font-bold text-text-muted/50 truncate w-12 text-center">{b.label.substring(0, 5)}</span>
                    ))}
                  </div>
                  <div className="px-4 pb-2">
                    <BarChartSVG
                      labels={branchPerfData.map(b => b.label)}
                      values={branchPerfData.map(b => b.value)}
                      color="#f59e0b"
                    />
                  </div>
                  <div className="flex justify-between px-5 pb-4">
                    {branchPerfData.map(b => (
                      <span key={b.label} className="text-[8px] font-bold text-text-muted/40 truncate w-12 text-center">
                        {b.value > 0 ? `${(b.value / 1_000_000).toFixed(1)}M` : '—'}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Recent Sales Table */}
          {profitability.length > 0 && (
            <div className="bg-surface-card border border-border-subtle/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border-subtle/20">
                <h3 className="text-[14px] font-black text-text-main">Recent Sales</h3>
                <p className="text-[11px] text-text-muted/60 mt-0.5">Last {Math.min(profitability.length, 5)} vehicles sold</p>
              </div>
              <div className="divide-y divide-border-subtle/20">
                {profitability.slice(0, 5).map((p: any, i: number) => {
                  const isUp = Number(p.netProfit) > 0;
                  return (
                    <div key={p.id || i} className="flex items-center justify-between px-6 py-3 hover:bg-bg-secondary/40 transition-colors">
                      <div>
                        <p className="text-[13px] font-bold text-text-main">{p.vehicle}</p>
                        <p className="text-[11px] text-text-muted/60">{p.branchName || '—'} · {p.soldDate ? new Date(p.soldDate).toLocaleDateString() : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-[14px] font-black', isUp ? 'text-success' : 'text-error-main')}>
                          {isUp ? '+' : ''}{(Number(p.netProfit) / 1_000_000).toFixed(2)}M
                        </p>
                        <p className="text-[10px] text-text-muted/50">{Number(p.margin).toFixed(1)}% margin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CARD VIEW — Escalated Pipeline (existing behaviour)
      ══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'cards' && (
        <div className="space-y-3 animate-fade-in">
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
              <div key={vehicle.id} className="bg-surface-card rounded-2xl border border-border-subtle/30 overflow-hidden flex flex-col transition-all">
                <div className="h-1 w-full bg-warning shrink-0" />

                {/* Thumbnail */}
                <div
                  className="h-28 md:h-40 w-full relative overflow-hidden bg-bg-secondary shrink-0 cursor-pointer group"
                  onClick={() => onViewReport(vehicle)}
                >
                  {vehicle.photos && vehicle.photos.length > 0 ? (
                    <img src={vehicle.photos[0]} alt={vehicle.vehicle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <CarFront size={28} className="text-text-muted opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <Badge variant="warning" className="text-[9px] md:text-[11px] px-1.5 md:px-2 py-0.5 shadow-md">Escalated</Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all shadow-xl">
                      View Details
                    </span>
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
                      <span className="text-text-dim font-mono">#{vehicle.id.substring(0, 6).toUpperCase()}</span>
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
      )}

    </div>
  );
};
