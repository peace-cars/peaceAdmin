import { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  Phone,
  User,
  Car,
  Calendar,
  Fuel,
  DollarSign,
  ClipboardList,
  UserPlus,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Eye
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';

interface CustomOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  make: string;
  model: string;
  yearRange: string;
  fuelType: string;
  dutyPreference: string;
  budgetEtb: number | null;
  notes: string | null;
  status: string;
  assignedStaff: string | null;
  assignedStaffPhone: string | null;
  staffNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'primary' | 'warning' | 'success' | 'error' | 'info'; icon: any }> = {
  PENDING:    { label: 'Pending',    variant: 'warning', icon: Clock },
  REVIEWING:  { label: 'Reviewing',  variant: 'primary', icon: Eye },
  SOURCING:   { label: 'Sourcing',   variant: 'info',    icon: Package },
  FOUND:      { label: 'Found',      variant: 'success', icon: CheckCircle2 },
  DELIVERED:  { label: 'Delivered',  variant: 'success', icon: Truck },
  CANCELLED:  { label: 'Cancelled',  variant: 'error',   icon: XCircle },
};

const STATUSES = ['PENDING', 'REVIEWING', 'SOURCING', 'FOUND', 'DELIVERED', 'CANCELLED'];

export default function CustomOrders() {
  const { session } = useAuth();
  const role = localStorage.getItem('admin_role');
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  const fetchOrders = async () => {
    try {
      const data = await api.get<CustomOrder[]>('/custom-orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[CustomOrders] Fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await api.get<any[]>('/people');
      setStaffList(
        Array.isArray(data)
          ? data.filter((s: any) => s.isActive && s.role === 'STAFF')
          : []
      );
    } catch (err) {
      console.error('[CustomOrders] Staff fetch failed', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchOrders();
      fetchStaff();
    }
  }, [session]);

  const handleAssign = async () => {
    if (!selectedOrder || !selectedStaffId) return;
    try {
      await api.patch(`/custom-orders/${selectedOrder.id}/assign`, {
        staffId: selectedStaffId,
      });
      setAssignModalOpen(false);
      setSelectedStaffId('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      console.error('[CustomOrders] Assign failed', err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !selectedStatus) return;
    try {
      await api.patch(`/custom-orders/${selectedOrder.id}/status`, {
        status: selectedStatus,
        staffNotes: staffNotes || undefined,
      });
      setStatusModalOpen(false);
      setSelectedStatus('');
      setStaffNotes('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      console.error('[CustomOrders] Status update failed', err);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      o.make.toLowerCase().includes(q) ||
      o.model.toLowerCase().includes(q) ||
      o.customerPhone.includes(q);
    return matchesFilter && matchesSearch;
  });

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const canManage = role === 'GENERAL_MANAGER' || role === 'DISTRICT_MANAGER';

  return (
    <div className="animate-fade-in relative min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 -mx-4 md:-mx-8 -mt-5 md:-mt-8 px-4 md:px-8 py-3 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle/50 flex flex-col gap-3 mb-4 shadow-sm overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 border border-primary-main/20 flex items-center justify-center">
              <Building2 size={20} className="text-primary-main" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-text-main tracking-tight">
                Custom Sourcing
              </h1>
              <p className="text-[12px] text-text-muted font-medium">
                {orders.length} total request{orders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex bg-bg-secondary p-1 rounded-xl overflow-x-auto no-scrollbar flex-1">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={cn(
                'px-3 py-2 text-[12px] font-medium rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap',
                activeFilter === 'ALL'
                  ? 'bg-surface-card text-primary-main shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              )}
            >
              All
              <Badge variant={activeFilter === 'ALL' ? 'primary' : 'default'}>
                {orders.length}
              </Badge>
            </button>
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setActiveFilter(s)}
                  className={cn(
                    'px-3 py-2 text-[12px] font-medium rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap',
                    activeFilter === s
                      ? 'bg-surface-card text-primary-main shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  )}
                >
                  {cfg?.label || s}
                  <Badge variant={activeFilter === s ? 'primary' : 'default'}>
                    {statusCounts[s] || 0}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              type="text"
              placeholder="Search name, make, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-bg-secondary border border-border-subtle rounded-xl h-11 pl-10 pr-4 text-[14px] text-text-main focus:outline-none focus:border-primary-main/30 focus:ring-2 focus:ring-primary-main/10 transition-all w-full placeholder:text-text-muted"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
          <p className="text-text-muted text-[13px] font-medium">Loading sourcing requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center">
            <Building2 size={28} className="text-text-muted/40" />
          </div>
          <p className="text-text-muted text-[14px] font-medium">
            No sourcing requests found.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={order.id}
                className="bg-surface-card border border-border-subtle/40 rounded-2xl p-4 md:p-5 hover:border-border-subtle/80 transition-all shadow-sm group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left: Customer + Vehicle */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <Badge variant={cfg.variant}>
                        <StatusIcon size={12} />
                        {cfg.label}
                      </Badge>
                      <span className="text-[11px] font-mono text-text-muted/50">
                        {order.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-bg-secondary border border-border-subtle/50 flex items-center justify-center">
                        <Car size={18} className="text-text-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-text-main tracking-tight truncate">
                          {order.make} {order.model}
                        </p>
                        <p className="text-[12px] text-text-muted font-medium truncate">
                          {order.yearRange} · {order.fuelType} · {order.dutyPreference?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <User size={13} />
                        {order.customerName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} />
                        {order.customerPhone}
                      </span>
                      {order.budgetEtb && (
                        <span className="flex items-center gap-1.5 font-semibold text-primary-main">
                          <DollarSign size={13} />
                          {Number(order.budgetEtb).toLocaleString()} ETB
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {order.assignedStaff && (
                      <div className="hidden md:flex items-center gap-1.5 bg-bg-secondary border border-border-subtle/30 rounded-lg px-2.5 py-1.5">
                        <UserPlus size={13} className="text-primary-main" />
                        <span className="text-[12px] font-medium text-text-secondary truncate max-w-[100px]">
                          {order.assignedStaff}
                        </span>
                      </div>
                    )}

                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setSelectedStatus(order.status);
                            setStaffNotes(order.staffNotes || '');
                            setStatusModalOpen(true);
                          }}
                        >
                          <ClipboardList size={14} />
                          <span className="hidden md:inline">Update</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setAssignModalOpen(true);
                          }}
                        >
                          <UserPlus size={14} />
                          <span className="hidden md:inline">Assign</span>
                        </Button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-9 h-9 rounded-xl bg-bg-secondary border border-border-subtle/30 flex items-center justify-center text-text-muted hover:text-primary-main hover:bg-surface-card transition-all active:scale-95"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedOrder && !assignModalOpen && !statusModalOpen}
        onClose={() => setSelectedOrder(null)}
        title="Sourcing Request Details"
        subtitle={`Reference: ${selectedOrder?.id?.substring(0, 12).toUpperCase() || 'N/A'}`}
        maxWidth="max-w-xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <DetailRow label="Status">
              <Badge variant={STATUS_CONFIG[selectedOrder.status]?.variant || 'default'}>
                {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
              </Badge>
            </DetailRow>
            <div className="h-px bg-border-subtle/50" />

            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Customer
            </p>
            <DetailRow label="Name" value={selectedOrder.customerName} />
            <DetailRow label="Phone" value={selectedOrder.customerPhone} />

            <div className="h-px bg-border-subtle/50" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Vehicle Spec
            </p>
            <DetailRow label="Make / Model" value={`${selectedOrder.make} ${selectedOrder.model}`} />
            <DetailRow label="Year Range" value={selectedOrder.yearRange} />
            <DetailRow label="Fuel Type" value={selectedOrder.fuelType} />
            <DetailRow label="Duty Preference" value={selectedOrder.dutyPreference?.replace(/_/g, ' ')} />
            {selectedOrder.budgetEtb && (
              <DetailRow label="Budget" value={`${Number(selectedOrder.budgetEtb).toLocaleString()} ETB`} />
            )}

            <div className="h-px bg-border-subtle/50" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Assignment
            </p>
            <DetailRow label="Assigned Staff" value={selectedOrder.assignedStaff || 'Unassigned'} />
            {selectedOrder.notes && <DetailRow label="Customer Notes" value={selectedOrder.notes} />}
            {selectedOrder.staffNotes && <DetailRow label="Staff Notes" value={selectedOrder.staffNotes} />}

            <DetailRow
              label="Created"
              value={new Date(selectedOrder.createdAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            />
          </div>
        )}
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setSelectedStaffId(''); }}
        title="Assign Staff"
        subtitle={`${selectedOrder?.make} ${selectedOrder?.model} — ${selectedOrder?.customerName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => { setAssignModalOpen(false); setSelectedStaffId(''); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssign} disabled={!selectedStaffId}>
              Assign
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {staffList.length === 0 ? (
            <p className="text-[13px] text-text-muted py-6 text-center">
              No staff members available.
            </p>
          ) : (
            staffList.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStaffId(s.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  selectedStaffId === s.id
                    ? 'border-primary-main bg-primary-main/5 ring-2 ring-primary-main/20'
                    : 'border-border-subtle/40 bg-bg-secondary hover:border-border-subtle'
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-surface-card border border-border-subtle/50 flex items-center justify-center shrink-0">
                  <User size={16} className="text-text-muted" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-text-main truncate">{s.fullName}</p>
                  <p className="text-[12px] text-text-muted">{s.phone || 'No phone'}</p>
                </div>
                {selectedStaffId === s.id && (
                  <CheckCircle2 size={18} className="text-primary-main ml-auto shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setSelectedStatus(''); setStaffNotes(''); }}
        title="Update Status"
        subtitle={`${selectedOrder?.make} ${selectedOrder?.model}`}
        footer={
          <>
            <Button variant="outline" onClick={() => { setStatusModalOpen(false); setSelectedStatus(''); setStaffNotes(''); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStatusUpdate} disabled={!selectedStatus}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
              New Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border text-[13px] font-medium transition-all text-left',
                      selectedStatus === s
                        ? 'border-primary-main bg-primary-main/5 text-primary-main ring-2 ring-primary-main/20'
                        : 'border-border-subtle/40 bg-bg-secondary text-text-secondary hover:border-border-subtle'
                    )}
                  >
                    <Icon size={15} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
              Staff Notes (Optional)
            </label>
            <textarea
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about sourcing progress..."
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl p-3 text-[14px] text-text-main focus:outline-none focus:border-primary-main/30 focus:ring-2 focus:ring-primary-main/10 transition-all resize-none placeholder:text-text-muted"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] text-text-muted font-medium shrink-0">{label}</span>
      {children || (
        <span className="text-[13px] font-semibold text-text-main text-right">{value || '—'}</span>
      )}
    </div>
  );
}
