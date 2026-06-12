import { useState, useEffect } from 'react';
import { FileText, Search, ExternalLink, Clock, HardDrive } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { SectionCard } from '../components/ui/SectionCard';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { apiCache } from '../lib/cache';

export default function AssetLibrary() {
  const { session } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dmBranches, setDmBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(
    () => localStorage.getItem('admin_selected_branch') || 'ALL'
  );

  const selectBranch = (id: string, name?: string) => {
    setSelectedBranch(id);
    localStorage.setItem('admin_selected_branch', id);
    localStorage.setItem('admin_selected_branch_name', id === 'ALL' ? 'ALL BRANCHES' : (name || 'Branch'));
    apiCache.clear();
  };

  useEffect(() => {
    if (!session) return;
    const fetchAssets = async () => {
      try {
        if (session.profile?.role === 'GENERAL_MANAGER') {
          api.get<any[]>('/locations').then(data => {
            setDmBranches(Array.isArray(data) ? data : []);
          }).catch(console.error);
        }

        const [vehicles, budgets] = await Promise.all([
          api.get<any[]>('/vehicles'),
          api.get<any[]>('/staff-budgets'),
        ]);

        const allAssets: any[] = [];

        vehicles.forEach((v: any) => {
          if (v.gallery && Array.isArray(v.gallery)) {
            v.gallery.forEach((url: string, i: number) => {
              allAssets.push({
                id: `v-img-${v.id}-${i}`,
                name: `${v.make} ${v.model} - Photo ${i + 1}`,
                url,
                type: 'IMAGE',
                category: 'INVENTORY',
                owner: 'Inventory Management',
                created: v.created_at,
              });
            });
          }
          if (v.internal_documents && Array.isArray(v.internal_documents)) {
            v.internal_documents.forEach((url: string, i: number) => {
              allAssets.push({
                id: `v-doc-${v.id}-${i}`,
                name: `${v.make} ${v.model} - Doc`,
                url,
                type: 'PDF',
                category: 'INVENTORY',
                owner: 'Branch Staff',
                created: v.created_at,
              });
            });
          }
        });

        budgets.forEach((b: any) => {
          if (b.receipt_url) {
            allAssets.push({
              id: `b-rec-${b.id}`,
              name: `Receipt: ${b.purpose}`,
              url: b.receipt_url,
              type: b.receipt_url.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGE',
              category: 'FINANCE',
              owner: b.profiles?.full_name || 'Staff Member',
              created: b.created_at,
            });
          }
        });

        setAssets(
          allAssets.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [session, selectedBranch]);

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = typeFilter === 'ALL' || a.category === typeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-grow">
          <div className="relative max-w-sm flex-grow">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/30"
            size={14}
          />
          <input
            type="text"
            placeholder="Filter archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-secondary border border-border-subtle/50 rounded-lg py-2 pl-10 pr-4 text-[13px] font-medium text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary-main/30 transition-all shadow-sm"
          />
        </div>
        {session?.profile?.role === 'GENERAL_MANAGER' && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-text-muted hidden sm:inline">Viewing:</span>
            <select 
              className="bg-surface-card border border-border-subtle text-[13px] md:text-[14px] font-semibold h-10 px-3 pr-8 rounded-xl text-text-main outline-none focus:border-primary-main/50 appearance-none cursor-pointer shadow-sm transition-all"
              value={selectedBranch}
              onChange={(e) => {
                const id = e.target.value;
                const branch = dmBranches.find((b: any) => b.id === id);
                selectBranch(id, branch?.name || branch?.code);
              }}
            >
              <option value="ALL">National Overview</option>
              {dmBranches.map(b => (
                <option key={b.id} value={b.id}>{b.name || b.code}</option>
              ))}
            </select>
          </div>
        )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['ALL', 'INVENTORY', 'FINANCE'].map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-[11px] font-medium transition-all border shrink-0',
                typeFilter === f
                  ? 'bg-primary-main border-primary-main text-[#FFFFFF] shadow-md'
                  : 'bg-surface-card border-border-subtle/50 text-text-muted/60 hover:bg-bg-secondary',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {loading ? (
          Array(12)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-bg-base/30 rounded-xl animate-pulse border border-border-subtle/30"
              />
            ))
        ) : filteredAssets.length === 0 ? (
          <div className="col-span-full py-24 text-center border border-dashed border-border-subtle/30 rounded-xl bg-bg-secondary">
            <FileText className="mx-auto text-text-muted/10 mb-2" size={32} />
            <p className="text-text-muted font-medium text-[11px] opacity-30">
              No archived assets found.
            </p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 p-3 flex flex-col items-center text-center relative group"
            >
              <div className="w-full aspect-square bg-bg-secondary border border-border-subtle/20 rounded-lg flex items-center justify-center text-primary-main mb-3 overflow-hidden relative shadow-inner">
                {asset.type === 'IMAGE' ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <FileText size={32} className="opacity-10" />
                )}
                <div className="absolute inset-0 bg-text-main/0 hover:bg-text-main/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => window.open(asset.url, '_blank')}
                    className="p-2.5 bg-bg text-text-main rounded-lg shadow-xl transform scale-90 group-hover:scale-100 transition-all active:scale-95"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>

              <div className="w-full space-y-1">
                <h4 className="text-[12px] font-bold text-text-main tracking-tight uppercase line-clamp-1 group-hover:text-primary-main transition-colors px-1 leading-tight">
                  {asset.name}
                </h4>
                <div className="flex items-center justify-center gap-1 text-[7px] font-bold text-text-muted font-medium opacity-30">
                  <Clock size={8} /> {new Date(asset.created).toLocaleDateString()}
                </div>
              </div>

              <div className="absolute top-1.5 left-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[6px] font-medium border shadow-sm',
                    asset.category === 'FINANCE'
                      ? 'bg-success border-success text-bg'
                      : 'bg-text-main border-text-main text-bg',
                  )}
                >
                  {asset.category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
