import { useState, useEffect } from "react";
import { 
  FileText, CheckCircle2, Clock, AlertTriangle, 
  Search, User, BarChart3, TrendingUp, Star
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

export default function StaffReports() {
  const { session } = useAuth();
  const [personnelMetrics, setPersonnelMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!session) return;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-performance/leaderboard`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setPersonnelMetrics(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [session]);

  const filteredMetrics = personnelMetrics.filter(m => 
    m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalActions = personnelMetrics.reduce((sum, m) => sum + (m.totalSales || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      <PageHeader 
        title="Personnel Metrics" 
        subtitle="Efficiency indexing, compensation audits, and regional productivity analytics."
        icon={<BarChart3 size={18} className="text-primary-main" />}
        actions={
           <Button variant="primary" className="rounded-xl h-11 px-6 font-bold text-[12px] shadow-xl bg-text-main text-bg active:scale-95 transition-all">Generate Audit</Button>
        }
        className="pb-6 border-b border-border-subtle/30"
      />

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between px-1">
        <div className="relative flex-grow max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={14} />
          <input 
            type="text" 
            placeholder="Search personnel registry..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-secondary border border-border-subtle/30 rounded-xl py-3 pl-12 pr-6 text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary-main/30 transition-all text-[11px] font-bold shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-bg-secondary/30 p-1.5 rounded-xl border border-border-subtle/30">
           <div className="px-4 py-2 bg-surface-card rounded-lg shadow-sm border border-border-subtle/30">
              <p className="text-[11px] text-text-muted/40 uppercase tracking-wider mb-0.5">Operational Capacity</p>
              <p className="text-sm font-bold text-text-main tracking-tight">{totalActions.toLocaleString()} <span className="text-[12px] opacity-30 ml-0.5">Units</span></p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-[12px] font-bold text-text-muted font-medium">Personnel Registry</h2>
              <div className="flex-grow mx-4 h-px bg-border-subtle/30" />
           </div>
           
           <div className="space-y-3">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-bg-secondary/30 h-20 rounded-xl animate-pulse border border-border-subtle/30" />
                ))
              ) : filteredMetrics.length === 0 ? (
                <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 transition-all duration-300 border-dashed py-24 text-center flex flex-col items-center justify-center gap-4">
                   <User size={32} className="text-text-muted/10" />
                   <p className="text-text-muted/40 font-bold text-[12px] italic">Registry Empty.</p>
                </div>
              ) : filteredMetrics.map((staff) => (
                <div key={staff.id} className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 p-5 hover:border-primary-main/20 group">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-lg bg-bg-secondary border border-border-subtle/30 flex items-center justify-center text-text-muted/60 font-bold text-sm group-hover:bg-primary-main/10 group-hover:text-primary-main transition-all shadow-inner">
                            {staff.fullName?.[0] || 'U'}
                         </div>
                         <div className="space-y-1">
                            <h3 className="text-base font-bold text-text-main tracking-tight leading-tight group-hover:text-primary-main transition-colors">{staff.fullName}</h3>
                            <div className="flex items-center gap-2">
                               <span className="text-[11px] text-text-muted/60 font-medium bg-bg-secondary px-2 py-0.5 rounded border border-border-subtle/30">{staff.role?.replace(/_/g, ' ')}</span>
                               <span className="text-[11px] text-text-muted/20 font-mono">ID: {staff.id?.substring(0,8).toUpperCase()}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex-grow max-w-[200px] space-y-2">
                         <div className="flex justify-between items-end">
                            <p className="text-[11px] text-text-muted/40 uppercase tracking-tight">Load</p>
                            <p className="text-[13px] font-bold text-text-main">{(staff.totalSales / (totalActions || 1) * 100).toFixed(1)}%</p>
                         </div>
                         <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-subtle/30">
                            <div 
                              className="h-full bg-primary-main rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary-main-rgb),0.3)]"
                              style={{ width: `${(staff.totalSales / (totalActions || 1) * 100)}%` }}
                            />
                         </div>
                      </div>

                      <div className="text-left md:text-right shrink-0 px-8 border-l border-border-subtle/30">
                         <p className="text-[11px] text-text-muted font-medium mb-0.5 opacity-40">Settled</p>
                         <p className="text-base font-bold text-text-main tracking-tight leading-none">{staff.totalSales || 0}</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h2 className="text-[12px] font-bold text-text-muted font-medium">Analytics</h2>
                 <div className="flex-grow mx-4 h-px bg-border-subtle/30" />
              </div>
              <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 transition-all duration-300 text-white p-6 space-y-6 relative overflow-hidden">
                 <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-lg">
                       <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[11px] font-bold opacity-50 font-medium mb-0.5">Efficiency Index</p>
                       <p className="text-xl font-bold tracking-tight">94.2%</p>
                    </div>
                 </div>
                 <div className="relative z-10 pt-4 border-t border-white/10">
                    <p className="text-[12px] font-bold opacity-60 leading-relaxed font-medium">
                       Optimized regional baseline across all active hubs.
                    </p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h2 className="text-[12px] font-bold text-text-muted font-medium">Compensation Audit</h2>
                 <div className="flex-grow mx-4 h-px bg-border-subtle/30" />
              </div>
               <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 transition-all duration-300 p-6 space-y-6">
                 <div className="space-y-1">
                    <p className="text-[11px] font-bold text-text-muted/40 uppercase tracking-tight">Base Allocation</p>
                    <p className="text-xl font-bold text-text-main tracking-tight leading-none">12.5M <span className="text-[12px] text-primary-main font-bold ml-0.5 font-medium">ETB</span></p>
                 </div>
                 <div className="h-px bg-border-subtle/30" />
                 <div className="space-y-1">
                    <p className="text-[11px] font-bold text-text-muted/40 uppercase tracking-tight">Yield Pool</p>
                    <p className="text-xl font-bold text-success tracking-tight leading-none">+840K <span className="text-[12px] font-bold ml-0.5 font-medium">ETB</span></p>
                 </div>
                 <Button variant="outline" className="w-full h-11 rounded-lg border-border-subtle/30 text-[12px] font-bold hover:bg-bg-secondary transition-all active:scale-95">Audit Log</Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
