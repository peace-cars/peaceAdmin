import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  Archive,
  Car,
  ChevronRight,
  Package,
  Zap,
  FileText,
  Building2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache, apiCache } from '../lib/cache';

// Shared UI components
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { SalesReceipt } from '../components/documents/SalesReceipt';

// Sub-components
import { MobileKpis } from '../components/inventory/MobileKpis';
import { VehicleGrid } from '../components/inventory/VehicleGrid';
import { DesktopTable } from '../components/inventory/DesktopTable';
import { DesktopSidebar } from '../components/inventory/DesktopSidebar';
import { AssetFormModal } from '../components/inventory/AssetFormModal';
import { AssetDetailsModal } from '../components/inventory/AssetDetailsModal';
import { StatusAlertModal } from '../components/inventory/StatusAlertModal';

const ITEMS_PER_PAGE = 20;

/** Safely convert spaces to underscores */
function spaceToUnderscore(str: string): string {
  return str.split(' ').join('_');
}

const InventoryManager = () => {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const showSold = searchParams.get('showSold') === 'true';

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showSuccess = (title: string, message: string) => {
    setStatusModal({ isOpen: true, type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    setStatusModal({ isOpen: true, type: 'error', title, message });
  };

  const [activeTab, setActiveTab] = useState<
    'core' | 'specs' | 'gallery' | 'financials' | 'archives'
  >('core');
  const [isAdding, setIsAdding] = useState(false);
  const [printReceiptOpen, setPrintReceiptOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [viewingCar, setViewingCar] = useState<any>(null);
  const _cachedVehicles = apiCache.get('/vehicles_GET_""');
  const [loading, setLoading] = useState(!_cachedVehicles);
  const [inventory, setInventory] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!showSold && car.status === 'SOLD') return false;
    const searchStr =
      `${car.make} ${car.model} ${car.year} ${car.plate} ${car.status}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  const displayedInventory = filteredInventory.slice(0, displayCount);

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

  const mapVehicle = (v: any) => ({
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
  });

  const handleVehicleData = (data: any) => {
    const arr = Array.isArray(data) ? data : [];
    setInventory(arr.map(mapVehicle));
    setLoading(false);
  };

  const fetchBranches = async () => {
    try {
      await fetchWithCache('/locations', {}, (data) => {
        setBranches(Array.isArray(data) ? data : []);
      });
    } catch (err) {
      console.error('[Inventory] Branch Fetch Failed', err);
    }
  };

  const fetchInventory = async () => {
    try {
      await fetchWithCache('/vehicles', {}, handleVehicleData);
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
      sold_date: formData.soldDate || null,
    };

    if (Array.isArray(formData.gallery) && formData.gallery.length > 0) {
      const validImages = formData.gallery.filter(
        (url: any) => typeof url === 'string' && url.trim().length > 0,
      );
      if (validImages.length > 0) payload.images = validImages;
    }

    if (Array.isArray(formData.internalDocuments) && formData.internalDocuments.length > 0) {
      const validDocs = formData.internalDocuments.filter(
        (url: any) => typeof url === 'string' && url.trim().length > 0,
      );
      if (validDocs.length > 0) payload.internal_documents = validDocs;
    } else {
      payload.internal_documents = [];
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

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/vehicles/${editingId}`, payload);
        showSuccess(
          'Registry Entry Updated',
          `${formData.make} ${formData.model} was successfully updated in the official ledger.`,
        );
      } else {
        await api.post('/vehicles', payload);
        showSuccess(
          'New Asset Registered',
          `${formData.make} ${formData.model} has been successfully recorded in the regional registry.`,
        );
      }
      setIsAdding(false);
      setEditingId(null);
      resetForm();
      apiCache.clear();
      fetchInventory();
    } catch (err: any) {
      console.error('[Inventory] Save Failed', err);
      showError(
        'Registration Failed',
        err?.response?.data?.message || err?.message || 'Could not commit asset modifications.',
      );
    } finally {
      setIsSubmitting(false);
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
    const car = inventory.find((c) => c.id === carId);
    const carLabel = car ? `${car.make} ${car.model}` : 'Vehicle';
    if (!window.confirm(`Are you sure you want to delete ${carLabel}?`)) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/vehicles/${carId}`);
      apiCache.clear();
      fetchInventory();
      showSuccess(
        'Asset Deleted',
        `${carLabel} was successfully removed from the active system registry.`,
      );
    } catch (err: any) {
      console.error('[Inventory] Delete Failed', err);
      showError(
        'Deletion Failed',
        err?.response?.data?.message || err?.message || 'Failed to remove the asset.',
      );
    } finally {
      setIsSubmitting(false);
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
      <div className="hidden md:block sticky top-0 z-30 -mx-4 md:-mx-8 -mt-1 md:-mt-4 border-b border-border-subtle/30 bg-bg-base px-4 py-4 shadow-sm md:px-8">
        <div className="rounded-[28px] border border-border-subtle/70 bg-surface-card p-4 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] md:p-5">
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
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  if (showSold) newParams.delete('showSold');
                  else newParams.set('showSold', 'true');
                  setSearchParams(newParams, { replace: true });
                }}
                className={`h-11 px-4 rounded-2xl border transition-all text-[13px] font-bold flex items-center gap-2 shrink-0 ${
                  showSold
                    ? 'bg-success/10 border-success/30 text-success-main'
                    : 'bg-bg-secondary border-border-subtle/30 text-text-muted hover:border-border-subtle'
                }`}
              >
                <Archive size={16} />
                {showSold ? 'Hide Sold' : 'View Sold'}
              </button>
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

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Tooltip content="Total number of vehicles in active registry">
          <KpiTile
            label="Inventory"
            value={inventory.length}
            icon={<Package size={14} />}
            className="p-6 h-32"
          />
        </Tooltip>
        <Tooltip content="Estimated market value of all registered assets">
          <KpiTile
            label="Portfolio Value"
            value={`${(totalValue / 1000000).toFixed(1)}M ETB`}
            icon={<Zap size={14} />}
            className="p-6 h-32"
          />
        </Tooltip>
        <Tooltip content="Total internal technical documents archived">
          <KpiTile
            label="Archives"
            value={archiveCount}
            icon={<FileText size={14} />}
            className="p-6 h-32"
          />
        </Tooltip>
        <Tooltip content="Active branch hubs reporting inventory">
          <KpiTile
            label="Active Hubs"
            value={branches.length}
            icon={<Building2 size={14} />}
            className="p-6 h-32"
          />
        </Tooltip>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="md:hidden flex flex-col gap-4">
            <div className="sticky top-0 z-40 bg-bg-base border-b border-border-subtle/30 shadow-sm -mx-4 px-4 pb-2 -mt-1">
              <div className="h-[40px] flex items-center">
                <span className="text-text-main font-black uppercase tracking-wide text-[16px]">
                  {localStorage.getItem('admin_selected_branch_name') || 'ALL BRANCHES'}
                </span>
              </div>
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

            <MobileKpis
              totalValue={totalValue}
              inventoryCount={inventory.length}
              branchCount={branches.length}
              archiveCount={archiveCount}
              loading={loading}
            />

            <VehicleGrid
              cars={displayedInventory}
              bottomRef={bottomRef}
              hasMore={displayCount < filteredInventory.length}
              onOpen={setViewingCar}
              onPrint={(car) => {
                setSelectedAsset(car);
                setPrintReceiptOpen(true);
              }}
              loading={loading}
            />
          </div>

          <DesktopTable
            cars={filteredInventory}
            onView={setViewingCar}
            onEdit={openEdit}
            onDelete={handleDelete}
            onPrint={(car) => {
              setSelectedAsset(car);
              setPrintReceiptOpen(true);
            }}
            loading={loading}
          />
        </div>

        <DesktopSidebar
          totalValue={totalValue}
          branchCount={branches.length}
          onAdd={openAdd}
          onRefresh={fetchInventory}
        />
      </div>

      <button
        onClick={openAdd}
        className="md:hidden fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full shadow-[0_18px_45px_-18px_rgba(15,23,42,0.75)] backdrop-blur-2xl bg-white/70 border border-white/25 text-primary-main flex items-center justify-center active:scale-90 transition-transform dark:bg-white/10 dark:border-white/10 dark:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.92)]"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

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
        isSubmitting={isSubmitting}
      />

      <AssetDetailsModal
        isOpen={!!viewingCar}
        car={viewingCar}
        onClose={() => setViewingCar(null)}
        onEdit={() => {
          setViewingCar(null);
          openEdit(viewingCar);
        }}
      />

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

      <StatusAlertModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
};

export default InventoryManager;
