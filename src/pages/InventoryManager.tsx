import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, ExternalLink, X, Image as ImageIcon, FileText, Settings, Zap, Building2, Package, LayoutGrid, Car, User, Printer
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
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
import { InventoryFooter } from '../components/ui/InventoryFooter';

const InventoryManager = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'core' | 'specs' | 'gallery' | 'financials' | 'archives'>('core');
  const [isAdding, setIsAdding] = useState(false);
  const [printReceiptOpen, setPrintReceiptOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<any>({
    make: '', model: '', year: new Date().getFullYear(),
    retailPrice: '', fuelType: 'ELECTRIC', dutyStatus: 'DUTY_PAID', plate: '', vin: '',
    branchId: '', status: 'SOURCING', certifiedKm: '',
    specifications: { batteryKwh: '', range: '', motorPower: '', driveTrain: 'RWD', interiorColor: 'Black', features: [] },
    gallery: [], internalDocuments: [],
    unitCost: '', floorPlanLoan: false, maturityDate: '', soldDate: ''
  });

  const filteredInventory = inventory.filter(car => {
    const searchStr = `${car.make} ${car.model} ${car.year} ${car.plate} ${car.status}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

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
        priceFormatted: v.retail_price_etb ? `${(Number(v.retail_price_etb) / 1000000).toFixed(1)}M ETB` : 'Price TBD',
        rawPrice: v.retail_price_etb || 0,
        fuel: v.fuel || v.fuel_type || 'N/A',
        plate: v.plate_code || v.plate_number || 'No Plate',
        status: (v.status || 'UNKNOWN').replace(/_/g, ' '),
        duty: (v.duty || v.duty_status || 'UNKNOWN').replace(/_/g, ' '),
        branchName: v.branches?.name || 'Main Registry',
        branchId: v.branch_id,
        image: (Array.isArray(v.gallery) && v.gallery.length > 0) ? v.gallery[0] : 
               (Array.isArray(v.images) && v.images.length > 0) ? v.images[0] :
               v.first_image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop',
        specifications: {
          batteryKwh: v.battery_capacity_kwh || '',
          range: v.range_km || '',
          motorPower: v.motor_power_kw || '',
          driveTrain: v.drive_train || 'RWD',
          interiorColor: v.interior_color || 'Black',
          features: v.features || []
        },
        gallery: Array.isArray(v.gallery) ? v.gallery : Array.isArray(v.images) ? v.images : [],
        certifiedKm: v.certified_km || null,
        internalDocuments: Array.isArray(v.internal_documents) ? v.internal_documents : [],
        unitCost: v.unit_cost || 0,
        floorPlanLoan: v.floor_plan_loan || false,
        maturityDate: v.maturity_date ? new Date(v.maturity_date).toISOString().split('T')[0] : '',
        soldDate: v.sold_date ? new Date(v.sold_date).toISOString().split('T')[0] : '',
        createdAt: v.created_at || new Date().toISOString()
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
    
    // Helper to validate UUID format
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Helper: safely coerce to number, returns undefined for empty/NaN
    const toNum = (val: any): number | undefined => {
      if (val === '' || val === null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    };

    // Map frontend camelCase to backend snake_case DTO
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

    // Sanitize gallery: ensure only valid URL strings are sent as images
    if (Array.isArray(formData.gallery) && formData.gallery.length > 0) {
      const validImages = formData.gallery.filter(
        (url: any) => typeof url === 'string' && url.trim().length > 0
      );
      if (validImages.length > 0) {
        payload.images = validImages;
      }
    }

    if (formData.specifications?.features && formData.specifications.features.length > 0) {
      payload.features = formData.specifications.features.filter(
        (f: any) => typeof f === 'string' && f.trim().length > 0
      );
    }

    // Only add branch_id if it's a valid UUID string and NOT a placeholder
    if (typeof formData.branchId === 'string' && isUUID(formData.branchId) && !formData.branchId.startsWith('66666666')) {
      payload.branch_id = formData.branchId;
    }

    console.log('[Inventory] Saving Payload:', payload);

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
    const defaultBranchId = session?.profile?.role === 'GENERAL_MANAGER' 
      ? (branches[0]?.id || '') 
      : (session?.profile?.branch_id || '');

    setFormData({
      make: '', model: '', year: new Date().getFullYear(), retailPrice: '', fuelType: 'ELECTRIC', dutyStatus: 'DUTY_PAID', plate: '', vin: '',
      branchId: defaultBranchId,
      status: 'SOURCING', certifiedKm: '',
      specifications: { batteryKwh: '', range: '', motorPower: '', driveTrain: 'RWD', interiorColor: 'Black', features: [] },
      gallery: [], internalDocuments: [],
      unitCost: '', floorPlanLoan: false, maturityDate: '', soldDate: ''
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

  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.rawPrice) || 0), 0);

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      <div className="sticky top-0 z-40 -mx-4 md:-mx-8 -mt-5 md:-mt-8 px-4 md:px-8 py-4 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle/30 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-primary-main shrink-0">
              <LayoutGrid size={24} strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-text-main tracking-tight">Asset Registry</h1>
              <p className="text-[13px] text-text-muted leading-relaxed">Consolidated management of regional vehicle inventory and technical archives.</p>
            </div>
          </div>
          <div className="w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar pb-1 -mb-1">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
               <div className="relative group flex-1 md:flex-none md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30 group-focus-within:text-primary-main transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-bg-secondary border border-border-subtle/30 rounded-2xl py-3.5 pl-12 pr-6 text-[13px] font-bold text-text-main focus:outline-none focus:border-primary-main/30 focus:ring-4 focus:ring-primary-main/5 transition-all w-full shadow-sm placeholder:text-text-muted/30" 
                  />
               </div>
               <Button variant="primary" className="h-12 px-6 md:px-8 shadow-lg shadow-primary-main/20 shrink-0 w-full md:w-auto text-sm md:text-base font-bold whitespace-nowrap" onClick={() => { setEditingId(null); setIsAdding(true); }}>
                  <Plus size={16} className="mr-2" /> Register Asset
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Tooltip content="Total number of vehicles in active registry">
          <KpiTile label="Inventory" value={inventory.length} icon={<Package size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Estimated market value of all registered assets">
          <KpiTile label="Portfolio Value" value={`${(totalValue / 1000000).toFixed(1)}M ETB`} icon={<Zap size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Total internal technical documents archived">
          <KpiTile label="Archives" value={inventory.reduce((s,v) => s+v.internalDocuments.length, 0)} icon={<FileText size={14} />} className="p-6 h-32" />
        </Tooltip>
        <Tooltip content="Active branch hubs reporting inventory">
          <KpiTile label="Active Hubs" value={branches.length} icon={<Building2 size={14} />} className="p-6 h-32" />
        </Tooltip>
      </div>

      <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 transition-all duration-300 p-2">
         <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
            <h2 className="text-[13px] font-bold text-text-main font-semibold">Registry Ledger</h2>
            <p className="text-[12px] text-text-muted/60 font-medium">Official documentation of vehicles across the branch network</p>
         </div>
         {/* DESKTOP VIEW - Data Dense Table */}
         <div className="overflow-x-auto hidden md:block">
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
              <tbody className="space-y-4">
                 {filteredInventory.map(car => (
                    <tr key={car.id} className="group transition-all">
                       <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-12 rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                                <img src={car.image} alt={car.model} className="w-full h-full object-cover" loading="lazy" />
                                {car.floorPlanLoan && <div className="absolute inset-0 border-2 border-warning rounded-xl" />}
                             </div>
                             <div className="space-y-1">
                                <p className="text-text-main font-bold text-sm tracking-tight leading-tight group-hover:text-primary-main transition-colors">{car.year} {car.make} {car.model}</p>
                                <Tooltip content="System Registry ID">
                                   <Badge variant="default" className="font-mono text-[12px] cursor-help bg-bg-secondary border border-border-subtle/30 text-text-muted/60">ID: {car.id.substring(0, 8).toUpperCase()}</Badge>
                                </Tooltip>
                             </div>
                          </div>
                       </td>
                       <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                          <div className="space-y-1.5">
                             <p className="text-text-main font-bold text-sm tracking-tight leading-none">{car.priceFormatted}</p>
                             <div className="flex flex-wrap gap-2">
                                <Tooltip content="Tax & Import Status">
                                   <Badge variant={car.duty === 'DUTY PAID' ? 'primary' : 'warning'} className="cursor-help">{car.duty === 'DUTY PAID' ? 'Tax Paid' : car.duty === 'DUTY FREE' ? 'Tax Exempt' : car.duty}</Badge>
                                </Tooltip>
                               {car.status === 'SHOWROOM' && Math.floor((new Date().getTime() - new Date(car.createdAt).getTime()) / (1000 * 3600 * 24)) > 30 && (
                                 <Tooltip content="Aged Inventory Alert">
                                    <Badge variant="error" className="cursor-help bg-error-main/10 text-error-main border border-error-main/20">Aged Stock</Badge>
                                 </Tooltip>
                               )}
                               {car.floorPlanLoan && (
                                 <Tooltip content={`Floor Plan Loan - Maturity: ${car.maturityDate || 'N/A'}`}>
                                    <Badge variant="default" className="cursor-help bg-warning/10 text-warning border border-warning/20">On Credit</Badge>
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
                             <Tooltip content={car.gallery.length > 0 ? "View Asset Photos" : "No Photos Uploaded"}>
                               <div className={cn(
                                 "p-2 rounded-xl border transition-all shadow-sm", 
                                 car.gallery.length > 0 ? "bg-primary-main/10 text-primary-main border-primary-main/20" : "bg-bg-secondary text-text-muted/10 border-border-subtle/30"
                               )}>
                                  <ImageIcon size={14} />
                               </div>
                             </Tooltip>
                             <Tooltip content={car.internalDocuments.length > 0 ? "View Technical Docs" : "No Docs Uploaded"}>
                               <div className={cn(
                                 "p-2 rounded-xl border transition-all shadow-sm", 
                                 car.internalDocuments.length > 0 ? "bg-warning/10 text-warning border-warning/20" : "bg-bg-secondary text-text-muted/10 border-border-subtle/30"
                               )}>
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
                                  onClick={() => {
                                    setSelectedAsset(car);
                                    setPrintReceiptOpen(true);
                                  }}
                               >
                                  <Printer size={14} />
                               </button>
                             </Tooltip>
                              <Tooltip content="Modify Asset Registry">
                               <button 
                                  className="w-10 h-10 flex items-center justify-center bg-bg-secondary rounded-xl text-text-muted/60 hover:text-primary-main border border-border-subtle/30 shadow-sm transition-all active:scale-90"
                                  onClick={() => {
                                    setEditingId(car.id);
                                    setFormData({
                                      make: car.make, model: car.model, year: car.year, retailPrice: car.rawPrice, fuelType: car.fuel,
                                      dutyStatus: String(car.duty || '').replace(/ /g, '_').toUpperCase(),
                                      plate: car.plate, vin: car.id, specifications: car.specifications || {},
                                      branchId: car.branchId,
                                      status: String(car.status || 'SOURCING').replace(/ /g, '_').toUpperCase(),
                                      certifiedKm: car.certifiedKm || '',
                                      gallery: car.gallery || [], internalDocuments: car.internalDocuments || [],
                                      unitCost: car.unitCost, floorPlanLoan: car.floorPlanLoan, maturityDate: car.maturityDate, soldDate: car.soldDate
                                    });
                                    setIsAdding(true);
                                  }}
                               >
                                  <Edit2 size={14} />
                               </button>
                             </Tooltip>
                             <Tooltip content="Remove Asset from Registry">
                               <button 
                                  className="w-10 h-10 flex items-center justify-center bg-bg-secondary rounded-xl text-text-muted/60 hover:text-error-main border border-border-subtle/30 shadow-sm transition-all active:scale-90"
                                  onClick={() => handleDelete(car.id)}
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

          {/* MOBILE VIEW - High-Density Compact List Rows */}
          <div className="md:hidden flex flex-col gap-2 p-2">
             {filteredInventory.map(car => (
                <div 
                  key={car.id} 
                  onClick={() => {
                    setEditingId(car.id);
                    setFormData({
                      make: car.make, model: car.model, year: car.year, retailPrice: car.rawPrice, fuelType: car.fuel,
                      dutyStatus: String(car.duty || '').replace(/ /g, '_').toUpperCase(),
                      plate: car.plate, vin: car.id, specifications: car.specifications || {},
                      branchId: car.branchId,
                      status: String(car.status || 'SOURCING').replace(/ /g, '_').toUpperCase(),
                      certifiedKm: car.certifiedKm || '',
                      gallery: car.gallery || [], internalDocuments: car.internalDocuments || [],
                      unitCost: car.unitCost, floorPlanLoan: car.floorPlanLoan, maturityDate: car.maturityDate, soldDate: car.soldDate
                    });
                    setIsAdding(true);
                  }}
                  className="bg-surface-card rounded-xl border border-border-subtle/30 cursor-pointer hover:border-primary-main/30 flex items-center p-2 gap-3 transition-all active:scale-[0.98] shadow-sm relative group overflow-hidden"
                >
                   {/* Square Thumbnail - 14x14 units = 56px */}
                   <div className="w-14 h-14 rounded-lg overflow-hidden border border-border-subtle/30 bg-bg-secondary shrink-0 relative shadow-inner">
                     <img src={car.image} alt={car.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                     {car.floorPlanLoan && <div className="absolute inset-0 border-2 border-warning rounded-lg" />}
                     <div className="absolute bottom-0.5 right-0.5 bg-black/80 rounded px-1 py-0.2 text-[7px] font-bold text-white tracking-widest uppercase">
                        #{car.id.substring(0,4)}
                     </div>
                   </div>
                   
                   {/* Info Area */}
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-baseline justify-between gap-2">
                         <h3 className="text-xs font-bold text-text-main leading-tight tracking-tight truncate">
                           {car.year} {car.make} <span className="font-medium text-text-muted">{car.model}</span>
                         </h3>
                         <span className="text-xs font-black text-primary-main tracking-tight leading-none shrink-0">
                           {car.priceFormatted}
                         </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                         <div className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0", 
                           car.duty === 'DUTY PAID' ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20")}>
                           {car.duty === 'DUTY PAID' ? 'Tax Paid' : car.duty === 'DUTY FREE' ? 'Tax Exempt' : car.duty}
                         </div>
                         {car.status && (
                           <div className="px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted border border-border-subtle/30 text-[8px] font-bold uppercase truncate max-w-[100px]">
                             {String(car.status).replace(/_/g, ' ')}
                           </div>
                         )}
                         {car.certifiedKm && (
                           <div className="text-[9px] text-text-dim truncate">
                             {car.certifiedKm} km
                           </div>
                         )}
                      </div>
                   </div>

                   {/* Quick Receipt Action */}
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setSelectedAsset(car);
                       setPrintReceiptOpen(true);
                     }}
                     className="w-8 h-8 flex items-center justify-center bg-bg-secondary hover:bg-bg-secondary/80 text-text-muted hover:text-text-main border border-border-subtle/30 rounded-lg active:scale-90 transition-all shrink-0"
                     title="Print Receipt"
                   >
                     <Printer size={12} />
                   </button>
                </div>
             ))}
          </div>
      </div>

      <Modal
        isOpen={isAdding}
        onClose={() => { resetForm(); setIsAdding(false); }}
        title={editingId ? 'Edit Asset Registry' : 'New Asset Registration'}
        subtitle="Regional vehicle inventory and technical archives."
        maxWidth="max-w-4xl"
        footer={
          <>
            <Button variant="outline" className="flex-1 h-12" onClick={() => setIsAdding(false)}>Cancel Operation</Button>
            <Button variant="primary" className="flex-1 h-12 shadow-lg shadow-primary-main/20" onClick={(e) => handleSubmit(e as any)}>
               {editingId ? 'Commit Asset Changes' : 'Finalize Registry Entry'}
            </Button>
          </>
        }
      >
         <div className="flex flex-col h-full">
           <div className="flex overflow-x-auto no-scrollbar gap-2 bg-bg-secondary/50 p-1.5 rounded-2xl border border-border-subtle/30 shrink-0">
              {[
                { id: 'core', label: 'Core Registry', icon: <Package size={14} /> },
                { id: 'specs', label: 'Specifications', icon: <Settings size={14} /> },
                { id: 'gallery', label: 'Asset Gallery', icon: <ImageIcon size={14} /> },
                { id: 'financials', label: 'Financials', icon: <Zap size={14} /> },
                { id: 'archives', label: 'Internal Archives', icon: <FileText size={14} /> }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-all rounded-xl whitespace-nowrap shrink-0",
                    activeTab === tab.id ? "bg-surface-card text-primary-main shadow-sm border border-border-subtle/30" : "text-text-muted/60 hover:text-text-main hover:bg-bg-secondary"
                  )}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto mt-4 px-1 pb-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                 {activeTab === 'core' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                       <TextField label="Make" value={formData.make} onChange={v => setFormData({...formData, make: v})} placeholder="e.g. Toyota" />
                       <TextField label="Model" value={formData.model} onChange={v => setFormData({...formData, model: v})} placeholder="e.g. bZ4X" />
                       <TextField label="Year" type="number" value={formData.year} onChange={v => setFormData({...formData, year: parseInt(v)})} />
                       <TextField label="Retail Price (ETB)" type="number" value={formData.retailPrice} onChange={v => setFormData({...formData, retailPrice: parseInt(v)})} />
                       <SelectField label="Fuel Type" value={formData.fuelType} onChange={v => setFormData({...formData, fuelType: v})} options={['ELECTRIC','PETROL','HYBRID']} />
                       <SelectField label="Duty Status" value={formData.dutyStatus} onChange={v => setFormData({...formData, dutyStatus: v})} options={['DUTY_PAID','DUTY_FREE']} />
                       <TextField label="Plate" value={formData.plate} onChange={v => setFormData({...formData, plate: v})} />
                       <TextField label="VIN" value={formData.vin} onChange={v => setFormData({...formData, vin: v})} />
                       <SelectField label="Regional Hub" value={formData.branchId} onChange={v => setFormData({...formData, branchId: v})} options={branches.map(b => ({ label: b.name, value: b.id }))} />
                       <SelectField label="System Status" value={formData.status} onChange={v => setFormData({...formData, status: v})} options={['SOURCING', 'SHOWROOM', 'SOLD']} />
                       <TextField label="Certified KM" type="number" value={formData.certifiedKm} onChange={v => setFormData({...formData, certifiedKm: v})} placeholder="e.g. 12000" />
                    </div>
                 )}

                  {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                       <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                          <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">Electric Powertrain</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                             <TextField label="Battery (kWh)" value={formData.specifications.batteryKwh} onChange={v => setFormData({...formData, specifications: {...formData.specifications, batteryKwh: v}})} />
                             <TextField label="Range (km)" value={formData.specifications.range} onChange={v => setFormData({...formData, specifications: {...formData.specifications, range: v}})} />
                          </div>
                          <TextField label="Motor Power" value={formData.specifications.motorPower} onChange={v => setFormData({...formData, specifications: {...formData.specifications, motorPower: v}})} />
                       </div>
                       <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                          <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">Chassis & Interior</p>
                          <SelectField label="Drive Train" value={formData.specifications.driveTrain} onChange={v => setFormData({...formData, specifications: {...formData.specifications, driveTrain: v}})} options={['RWD','AWD','FWD']} />
                          <TextField label="Interior Color" value={formData.specifications.interiorColor} onChange={v => setFormData({...formData, specifications: {...formData.specifications, interiorColor: v}})} />
                       </div>
                    </div>
                 )}

                 {activeTab === 'gallery' && (
                    <div className="space-y-6 md:space-y-10">
                       <ImageUpload 
                         bucket="vehicles" 
                         folder="gallery" 
                         maxFiles={12} 
                         onUploadComplete={(urls) => setFormData((prev:any) => ({ ...prev, gallery: [...prev.gallery, ...urls] }))} 
                        />
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                          {formData.gallery.map((url: string, i: number) => (
                             <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-border-subtle bg-bg-secondary shadow-sm group/img">
                                <img src={url} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setFormData({...formData, gallery: formData.gallery.filter((_:any, idx:number) => idx !== i)})} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-error-main text-white rounded-xl opacity-0 group-hover/img:opacity-100 transition-all shadow-lg scale-90 group-hover/img:scale-100">
                                   <X size={14} />
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                  {activeTab === 'financials' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                       <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                          <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">Costing & Sales</p>
                          <TextField label="True Unit Cost (ETB)" type="number" value={formData.unitCost} onChange={v => setFormData({...formData, unitCost: v})} placeholder="Include purchase + reconditioning" />
                          <TextField label="Sold Date" type="date" value={formData.soldDate} onChange={v => setFormData({...formData, soldDate: v})} />
                       </div>
                       <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                          <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">Floor Plan Management</p>
                          <div className="flex items-center gap-3 py-2 md:py-4">
                             <input type="checkbox" id="floorPlan" checked={formData.floorPlanLoan} onChange={e => setFormData({...formData, floorPlanLoan: e.target.checked})} className="w-5 h-5 rounded border-border-subtle/30 text-primary-main focus:ring-primary-main" />
                             <label htmlFor="floorPlan" className="text-sm font-bold text-text-main">Vehicle is on Floor Plan / Credit</label>
                          </div>
                          {formData.floorPlanLoan && (
                             <TextField label="Maturity / Payment Deadline" type="date" value={formData.maturityDate} onChange={v => setFormData({...formData, maturityDate: v})} />
                          )}
                       </div>
                    </div>
                 )}

                  {activeTab === 'archives' && (
                    <div className="space-y-6 md:space-y-8">
                       <ImageUpload 
                         bucket="vehicles" 
                         folder="documents" 
                         label="Upload Technical Dossiers" 
                         onUploadComplete={(urls) => setFormData((prev:any) => ({ ...prev, internalDocuments: [...prev.internalDocuments, ...urls] }))} 
                        />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          {formData.internalDocuments.map((doc: any, i: number | string) => (
                             <div key={i} className="bg-bg-secondary/50 border border-border-subtle/30 p-6 rounded-3xl flex items-center justify-between group/doc hover:bg-bg-secondary/80 hover:border-primary-main/30 transition-all shadow-sm">
                                <div className="flex items-center gap-5">
                                   <div className="bg-warning/10 border border-warning/20 w-12 h-12 rounded-2xl flex items-center justify-center text-warning shadow-sm">
                                      <FileText size={20} />
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[13px] font-bold text-text-main line-clamp-1">{typeof doc === 'string' ? doc.split('/').pop() : doc.name}</p>
                                      <p className="text-[13px] text-text-muted/40 font-bold uppercase tracking-wider">Internal Resource</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <button type="button" onClick={() => window.open(typeof doc === 'string' ? doc : doc.url, '_blank')} className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-xl text-text-muted/60 hover:text-primary-main shadow-sm transition-all active:scale-90"><ExternalLink size={16} /></button>
                                   <button type="button" onClick={() => setFormData({...formData, internalDocuments: formData.internalDocuments.filter((_:any, idx:number) => idx !== i)})} className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-xl text-error-main hover:bg-error-main/5 hover:border-error-main/20 shadow-sm transition-all active:scale-90"><Trash2 size={16} /></button>
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

      {/* Footer Consolidated Data */}
      <InventoryFooter totalValue={totalValue} />

      {/* Document Viewer for Print */}
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
                vin: selectedAsset.plate, // using plate as proxy for VIN if empty
                condition: 'Used',
                mileage: selectedAsset.certifiedKm || 0
              }
            }} 
            date={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          />
        </DocumentViewer>
      )}

    </div>
  );
};

export default InventoryManager;
