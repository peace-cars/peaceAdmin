import { useState, useEffect } from 'react';
import { MapPin, Plus, Power, Phone, Users, X, Building2, Globe, Activity, ChevronDown, ChevronRight, UserPlus, ShieldCheck, Star, Edit, Crown } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TextField, SelectField } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';

export default function BranchManagement() {
  const { session } = useAuth();
  const role = localStorage.getItem('admin_role') || 'DISTRICT_MANAGER';

  const [branches, setBranches] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [branchStaff, setBranchStaff] = useState<Record<string, any[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showAssignDM, setShowAssignDM] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '' });
  const [staffForm, setStaffForm] = useState({ personId: '', fullName: '', phone: '', role: 'STAFF', commissionTier: '1.0' });
  const [selectedDM, setSelectedDM] = useState('');

  const fetchBranches = async () => {
    try {
      const data = await api.get<any[]>('/locations');
      setBranches(Array.isArray(data) ? data.map((b: any) => ({
        ...b, phone: b.phone_number, isActive: b.is_active
      })) : []);
    } catch (e) { console.error(e); }
  };

  const fetchPeople = async () => {
    try {
      const data = await api.get<any[]>('/people');
      setPeople(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchBranchStaff = async (branchId: string) => {
    try {
      const data = await api.get<any[]>(`/locations/${branchId}/staff`);
      setBranchStaff(prev => ({ ...prev, [branchId]: Array.isArray(data) ? data : [] }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!session) return;
    fetchBranches();
    fetchPeople();
  }, [session]);

  const toggleExpand = (branchId: string) => {
    if (expandedBranch === branchId) {
      setExpandedBranch(null);
    } else {
      setExpandedBranch(branchId);
      if (!branchStaff[branchId]) fetchBranchStaff(branchId);
    }
  };

  const handleCreateBranch = async () => {
    try {
      const res = await api.post<any>('/locations', form);
      if (res.success || res.branch) {
        fetchBranches();
        setShowCreate(false);
        setForm({ name: '', code: '', address: '', phone: '' });
      } else {
        alert(res.message || 'Failed to create branch');
      }
    } catch (e: any) { 
      console.error(e); 
      alert(e?.message || 'Error creating branch');
    }
  };

  const assignDM = async (branchId: string) => {
    if (!selectedDM) return;
    try {
      const res = await api.patch<any>(`/locations/${branchId}/assign-manager`, { managerId: selectedDM });
      if (res.success || res.managerName) {
        fetchBranches();
        setShowAssignDM(null);
        setSelectedDM('');
      } else {
        alert(res.message || 'Failed to assign DM');
      }
    } catch (e: any) { 
      console.error(e); 
      alert(e?.message || 'Error assigning DM'); 
    }
  };

  const unassignDM = async (branchId: string) => {
    if (!window.confirm('Remove the District Manager from this branch?')) return;
    try {
      const res = await api.patch<any>(`/locations/${branchId}/unassign-manager`, {});
      if (res.success || res) fetchBranches();
    } catch (e) { console.error(e); }
  };

  const addStaffToBranch = async (branchId: string) => {
    if (!staffForm.personId) return;
    try {
      const res = await api.patch<any>(`/people/${staffForm.personId}`, {
        locationId: branchId
      });
      if (res.success === false) {
        alert(res.message || 'Failed to assign staff');
        return;
      }
      // The API returns success: true, or just doesn't throw
      fetchBranchStaff(branchId);
      fetchBranches();
      setShowAddStaff(null);
      setStaffForm(prev => ({ ...prev, personId: '' }));
    } catch (e: any) { 
      console.error(e); 
      alert(e?.message || 'Error assigning staff'); 
    }
  };

  const toggleBranchActive = async (id: string) => {
    try {
      const res = await api.patch<any>(`/locations/${id}/toggle`, {});
      if (res.success || res.isActive !== undefined) {
          setBranches(prev => prev.map(b => b.id === id ? { ...b, isActive: res.isActive !== undefined ? res.isActive : !b.isActive } : b));
      } else {
          alert(res.message || 'Failed to toggle branch');
      }
    } catch (e: any) { 
      console.error(e); 
      alert(e?.message || 'Error toggling branch');
    }
  };

  const availableDMs = people.filter(p =>
    p.role === 'DISTRICT_MANAGER' && !branches.some(b => b.manager_id === p.id)
  );

  const availableStaff = people.filter(p => 
    (p.role === 'STAFF' || p.role === 'BROKER') && p.locationId !== showAddStaff
  );

  const activeBranches = branches.filter(b => b.isActive).length;
  const totalStaff = branches.reduce((s, b) => s + (b.staffCount || 0), 0);
  const assignedDMs = branches.filter(b => b.manager_id).length;

  // DM can only see their own branch
  const visibleBranches = role === 'GENERAL_MANAGER'
    ? branches
    : branches.filter(b => {
        const myId = session?.user?.id;
        return b.manager_id === myId || people.find(p => p.id === myId)?.locationId === b.id;
      });

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Branch & Staff Management"
        subtitle={`Organizational hierarchy — ${branches.length} branches, ${totalStaff} personnel`}
        icon={<Building2 size={18} className="text-primary-main" />}
        actions={
          role === 'GENERAL_MANAGER' ? (
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}
              className="rounded-xl h-11 px-6 bg-text-main text-bg font-bold text-[12px] shadow-xl active:scale-95 transition-all w-full md:w-auto">
              <Plus size={14} className="mr-2" /> New Branch
            </Button>
          ) : null
        }
        className="pb-6 border-b border-border-subtle/30"
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Total Branches" value={branches.length} icon={<Globe size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Operational" value={activeBranches} icon={<Activity size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Assigned DMs" value={assignedDMs} icon={<Crown size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Total Personnel" value={totalStaff} icon={<Users size={14} />} className="rounded-xl p-4 h-28" />
      </div>

      {/* Branch Cards */}
      <div className="space-y-6">
        {visibleBranches.map(branch => (
          <div key={branch.id} className={cn(
            "bg-surface-card rounded-2xl border border-border-subtle/30 shadow-sm overflow-hidden transition-all",
            !branch.isActive && "opacity-60 grayscale-[0.5] border-dashed"
          )}>
            {/* Branch Header */}
            <div
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-bg-base/30 transition-all"
              onClick={() => toggleExpand(branch.id)}
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary-main/10 flex items-center justify-center border border-primary-main/10 shadow-inner">
                  <Building2 size={20} className="text-primary-main" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-text-main tracking-tight">{branch.name}</h3>
                    <Badge variant="default" className="text-[11px] font-mono">{branch.code}</Badge>
                    {branch.isActive
                      ? <Badge variant="primary" className="text-[11px]">Active</Badge>
                      : <Badge variant="warning" className="text-[11px]">Inactive</Badge>
                    }
                  </div>
                  <p className="text-[13px] text-text-muted font-medium flex items-center gap-1.5">
                    <MapPin size={10} /> {branch.address || 'No address'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* DM Badge */}
                {branch.managerName ? (
                  <div className="flex items-center gap-3 bg-warning/10 border border-warning/20 rounded-xl px-4 py-2">
                    <Crown size={14} className="text-warning" />
                    <div>
                      <p className="text-[11px] text-warning font-medium">District Manager</p>
                      <p className="text-xs font-bold text-warning tracking-tight">{branch.managerName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-error-main/10 border border-error-main/20 rounded-xl px-4 py-2">
                    <ShieldCheck size={14} className="text-error-main" />
                    <p className="text-[12px] text-error-main font-medium">No DM Assigned</p>
                  </div>
                )}

                {/* Staff Count */}
                <div className="flex items-center gap-2 bg-bg-base rounded-xl px-4 py-2 border border-border-subtle">
                  <Users size={14} className="text-text-muted" />
                  <span className="text-sm font-bold text-text-main">{branch.staffCount || 0}</span>
                  <span className="text-[11px] text-text-muted font-medium">Staff</span>
                </div>

                {/* Expand Arrow */}
                <div className={cn("transition-transform duration-300", expandedBranch === branch.id && "rotate-180")}>
                  <ChevronDown size={18} className="text-text-muted" />
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedBranch === branch.id && (
              <div className="border-t border-border-subtle/30 bg-bg-secondary/20 animate-in slide-in-from-top-2 duration-200">
                {/* Branch Actions Bar */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-border-subtle/20 bg-bg-secondary/50">
                  <div className="flex items-center gap-3">
                    {role === 'GENERAL_MANAGER' && (
                      <>
                        {branch.managerName ? (
                          <Button variant="outline" size="sm" onClick={() => unassignDM(branch.id)}
                            className="h-9 px-4 text-[12px] font-medium rounded-xl border-warning/20 text-warning hover:bg-warning/10">
                            <X size={12} className="mr-1.5" /> Remove DM
                          </Button>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => { setShowAssignDM(branch.id); setSelectedDM(''); }}
                            className="h-9 px-4 text-[12px] font-medium rounded-xl bg-warning hover:bg-warning/80 text-bg shadow-md">
                            <Crown size={12} className="mr-1.5" /> Assign DM
                          </Button>
                        )}
                      </>
                    )}
                    <Button variant="primary" size="sm" onClick={() => { setShowAddStaff(branch.id); setStaffForm(prev => ({ ...prev, personId: '' })); }}
                      className="h-9 px-4 text-[12px] font-medium rounded-xl shadow-md">
                      <UserPlus size={12} className="mr-1.5" /> Assign Staff
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleBranchActive(branch.id)}
                      className="h-9 px-4 text-[12px] font-medium rounded-xl">
                      <Power size={12} className="mr-1.5" /> {branch.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                  <p className="text-[12px] text-text-muted font-medium">
                    {branch.phone || 'No contact'} • ID: {branch.id?.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                {/* Staff Roster */}
                <div className="p-6">
                  {/* DM Section */}
                  {branch.managerName && (
                    <div className="mb-6">
                      <p className="text-[12px] font-bold text-text-muted font-medium mb-3">Branch Leadership</p>
                      <div className="flex items-center gap-4 bg-surface-card rounded-xl p-4 border border-warning/20 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                          <Crown size={18} className="text-warning" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-text-main tracking-tight">{branch.managerName}</p>
                          <p className="text-[12px] text-warning font-medium">District Manager</p>
                        </div>
                        {branch.managerPhone && (
                          <a href={`tel:${branch.managerPhone}`} className="text-[13px] text-primary-main font-bold flex items-center gap-1.5 hover:underline">
                            <Phone size={12} /> {branch.managerPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Staff List */}
                  <p className="text-[12px] font-bold text-text-muted font-medium mb-3">Branch Personnel</p>
                  {!branchStaff[branch.id] ? (
                    <div className="text-center py-12 text-[13px] text-text-muted font-medium animate-pulse">
                      Loading roster...
                    </div>
                  ) : branchStaff[branch.id].length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border-subtle/50 rounded-xl bg-bg-secondary/50">
                      <Users size={32} className="mx-auto text-text-muted opacity-10 mb-3" />
                      <p className="text-[13px] text-text-muted font-medium opacity-40">No staff assigned to this branch</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {branchStaff[branch.id].map(staff => (
                        <div key={staff.id} className="flex items-center gap-4 bg-surface-card rounded-xl p-4 border border-border-subtle/30 shadow-sm group hover:border-primary-main/30 transition-all">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold border shadow-inner",
                            staff.isActive ? "bg-primary-main/10 text-primary-main border-primary-main/10" : "bg-bg-secondary text-text-muted border-border-subtle"
                          )}>
                            {staff.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-text-main tracking-tight truncate group-hover:text-primary-main transition-colors">{staff.fullName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-text-muted font-medium">{staff.role?.replace(/_/g, ' ')}</span>
                              <span className="w-1 h-1 bg-border-subtle rounded-full" />
                              <span className="text-[11px] text-primary-main font-mono">{staff.commissionTier}x</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {staff.phone && (
                              <a href={`tel:${staff.phone}`} className="text-text-muted hover:text-primary-main transition-colors">
                                <Phone size={14} />
                              </a>
                            )}
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              staff.isActive ? "bg-success" : "bg-text-muted/30"
                            )} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Branch Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Register New Branch" subtitle="Initialize a regional operations hub" maxWidth="max-w-md">
        <div className="space-y-5">
          <TextField label="Branch Name" placeholder="e.g. Kazanchis Hub" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <TextField label="System Code" placeholder="e.g. KAZ-01" value={form.code} onChange={v => setForm({ ...form, code: v })} />
          <TextField label="Address" placeholder="Addis Ababa, ET" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          <TextField label="Phone" placeholder="+251 ..." value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 h-11 rounded-xl bg-text-main shadow-xl" disabled={!form.name || !form.code} onClick={handleCreateBranch}>
              Create Branch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign DM Modal */}
      <Modal isOpen={!!showAssignDM} onClose={() => setShowAssignDM(null)} title="Assign District Manager" subtitle="Select a DM to manage this branch" maxWidth="max-w-md">
        <div className="space-y-5">
          {availableDMs.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border-subtle/50 rounded-xl">
              <Crown size={32} className="mx-auto text-text-muted opacity-10 mb-3" />
              <p className="text-[13px] text-text-muted font-medium opacity-40">No available District Managers</p>
              <p className="text-[12px] text-text-muted mt-1">All DMs are already assigned to branches, or none exist yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableDMs.map(dm => (
                <button
                  key={dm.id}
                  onClick={() => setSelectedDM(dm.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    selectedDM === dm.id
                      ? "border-primary-main bg-primary-subtle/30 shadow-md"
                      : "border-border-subtle hover:border-primary-main/30 bg-white"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                    <Crown size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-main tracking-tight">{dm.fullName}</p>
                    <p className="text-[12px] text-text-muted font-medium">{dm.phone || 'No phone'}</p>
                  </div>
                  {selectedDM === dm.id && <div className="w-3 h-3 rounded-full bg-primary-main" />}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setShowAssignDM(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 shadow-xl" disabled={!selectedDM} onClick={() => showAssignDM && assignDM(showAssignDM)}>
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal isOpen={!!showAddStaff} onClose={() => setShowAddStaff(null)} title="Assign Staff" subtitle="Transfer existing personnel to this branch" maxWidth="max-w-md">
        <div className="space-y-5">
          {availableStaff.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border-subtle/50 rounded-xl">
              <Users size={32} className="mx-auto text-text-muted opacity-10 mb-3" />
              <p className="text-[13px] text-text-muted font-medium opacity-40">No available staff</p>
              <p className="text-[12px] text-text-muted mt-1">All staff are already assigned to this branch, or none exist.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableStaff.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => setStaffForm(prev => ({ ...prev, personId: staff.id }))}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    staffForm.personId === staff.id
                      ? "border-primary-main bg-primary-subtle/30 shadow-md"
                      : "border-border-subtle hover:border-primary-main/30 bg-white"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center border border-border-subtle">
                    <Users size={16} className="text-text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-main tracking-tight">{staff.fullName}</p>
                    <p className="text-[12px] text-text-muted font-medium">{staff.role} • {staff.locationName || 'Unassigned'}</p>
                  </div>
                  {staffForm.personId === staff.id && <div className="w-3 h-3 rounded-full bg-primary-main" />}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setShowAddStaff(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1 h-11 rounded-xl bg-text-main shadow-xl" disabled={!staffForm.personId} onClick={() => showAddStaff && addStaffToBranch(showAddStaff)}>
              Assign Staff
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
