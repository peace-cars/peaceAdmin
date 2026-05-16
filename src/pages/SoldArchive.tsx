import { useState, useEffect } from 'react';
import { Package, Search, DollarSign, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiTile } from '../components/ui/KpiTile';
import { Tooltip } from '../components/ui/Tooltip';
import { Badge } from '../components/ui/Badge';

const SoldArchive = () => {
  const { session } = useAuth();
  const [archive, setArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchive = async () => {
    try {
      const data = await api.get<any[]>('/vehicles');
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
          image: v.first_image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop',
          plate: v.plate_code || v.plate_number || 'No Plate'
        }));
      setArchive(soldVehicles);
    } catch (err) {
      console.error('[Sold Archive] Fetch Failed', err);
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-10 pb-20 animate-fade-in">
      <PageHeader 
        title="Sold Asset Archive & Profitability" 
        subtitle="Historical ledger of sold vehicles with true unit cost and profit margin analytics."
        icon={<DollarSign size={18} className="text-primary-main" />}
        actions={
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40 group-focus-within:text-primary-main transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search archive..." 
              className="bg-bg-secondary border border-border-subtle/30 rounded-2xl py-3.5 pl-12 pr-6 text-[13px] font-medium text-text-main focus:outline-none focus:border-primary-main/30 transition-all w-72 shadow-sm placeholder:text-text-muted/30" 
            />
          </div>
        }
        className="pb-8 border-b border-border-subtle/30"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 transition-all duration-300 p-2">
         <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
            <h2 className="text-[13px] font-bold text-text-main font-semibold">Sales Ledger</h2>
            <p className="text-[12px] text-text-muted/60 font-medium">Profitability breakdown by vehicle</p>
         </div>
         {/* DESKTOP VIEW - Data Dense Table */}
         <div className="overflow-x-auto hidden md:block">
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
                  {archive.map(car => (
                    <tr key={car.id} className="group transition-all">
                       <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 transition-all">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-12 rounded-xl overflow-hidden border border-border-subtle/30 bg-bg-secondary shrink-0 shadow-sm">
                                <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                             </div>
                             <div className="space-y-1">
                                <p className="text-text-main font-bold text-sm tracking-tight leading-tight">{car.name}</p>
                                <Badge variant="default" className="font-mono text-[12px] text-text-muted/60">{car.plate}</Badge>
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
                             <p className="text-[13px] text-text-muted/60 font-medium">Sale: {(car.price / 1000000).toFixed(2)}M ETB</p>
                             <p className="text-[13px] text-error-main font-medium">- Cost: {(car.unitCost / 1000000).toFixed(2)}M ETB</p>
                          </div>
                       </td>
                       <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 transition-all">
                          <div className="space-y-1 text-right">
                             <p className="text-xl font-black text-success-main tracking-tight">+{(car.profit / 1000000).toFixed(2)}M</p>
                             <Badge variant="success" className="bg-success-main/10 text-success-main border-none">
                               {car.price > 0 ? ((car.profit / car.price) * 100).toFixed(1) : 0}% Margin
                             </Badge>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {archive.length === 0 && !loading && (
                   <tr>
                     <td colSpan={4} className="py-12 text-center text-text-muted">No sold vehicles found in the archive.</td>
                   </tr>
                 )}
              </tbody>
            </table>
         </div>

         {/* MOBILE VIEW - Apple-Style Responsive Cards */}
         <div className="md:hidden flex flex-col gap-4 p-4">
            {archive.map(car => (
              <div key={car.id} className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 p-5 relative overflow-hidden group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-subtle/30 bg-bg-secondary shrink-0">
                       <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1 flex-1">
                       <h3 className="text-sm font-bold text-text-main tracking-tight leading-tight">{car.name}</h3>
                       <Badge variant="default" className="font-mono text-[12px] bg-bg-secondary border-border-subtle/30 text-text-muted/60">{car.plate}</Badge>
                       <div className="flex items-center gap-3 pt-1">
                          <span className="flex items-center gap-1.5 text-[12px] font-bold text-text-muted/60 font-medium">
                             <Calendar size={10} /> {car.soldDate}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-bg-secondary/30 rounded-xl p-3 border border-border-subtle/30 flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                       <p className="text-[12px] text-text-muted/60 font-medium">Sale Price</p>
                       <p className="text-xs font-bold text-text-main">{(car.price / 1000000).toFixed(2)}M ETB</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                       <p className="text-[12px] text-error-main font-medium">Unit Cost</p>
                       <p className="text-xs font-bold text-text-main">{(car.unitCost / 1000000).toFixed(2)}M ETB</p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between border-t border-border-subtle/30 pt-3">
                    <span className="text-[13px] font-bold text-text-muted/60 font-medium flex items-center gap-1.5">
                       <Building2 size={12} className="text-primary-main/30" /> {car.branchName}
                    </span>
                    <div className="text-right">
                       <p className="text-lg font-black text-success-main tracking-tight leading-none">+{(car.profit / 1000000).toFixed(2)}M</p>
                       <p className="text-[12px] font-bold text-success-main/70 font-medium mt-1">
                         {car.price > 0 ? ((car.profit / car.price) * 100).toFixed(1) : 0}% Margin
                       </p>
                    </div>
                 </div>
              </div>
            ))}
            {archive.length === 0 && !loading && (
              <div className="py-12 text-center text-[13px] font-medium text-text-muted">
                No sold vehicles found.
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SoldArchive;
