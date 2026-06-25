import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Power, Phone, Users, X, Building2, Globe, Activity,
  ChevronDown, ChevronRight, UserPlus, ShieldCheck, Crown, Network, Briefcase, Edit, Trash2
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache, apiCache } from '../lib/cache';
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TextField, SelectField } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../lib/utils';

export default function BranchManagement() {
  const { session } = useAuth();
  const role = localStorage.getItem('admin_role') || 'DISTRICT_MANAGER';

  const [branches, setBranches] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [branchStaff, setBranchStaff] = useState<Record<string, any[]>>({});
  
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any | null>(null);
  const [showAssignDM, setShowAssignDM] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '' });
  const [staffForm, setStaffForm] = useState({ personId: '' });
  const [selectedDM, setSelectedDM] = useState('');

  const fetchBranches = () => {
    fetchWithCache('/locations', {}, (data) => {
      setBranches(Array.isArray(data) ? data.map((b: any) => ({ ...b, phone: b.phone_number, isActive: b.is_active })) : []);
    }).catch(e => console.error(e));
  };

  const fetchPeople = () => {
    fetchWithCache('/people', {}, (data) => {
      setPeople(Array.isArray(data) ? data : []);
    }).catch(e => console.error(e));
  };

  const fetchBranchStaff = (branchId: string) => {
    fetchWithCache(`/locations/${branchId}/staff`, {}, (data) => {
      setBranchStaff((prev) => ({ ...prev, [branchId]: Array.isArray(data) ? data : [] }));
    }).catch(e => console.error(e));
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
    setIsSubmitting(true);
    try {
      const res = await api.post<any>('/locations', form);
      if (res.success || res.branch) {
        apiCache.clear();
        fetchBranches();
        setShowCreate(false);
        setForm({ name: '', code: '', address: '', phone: '' });
      } else alert(res.message || 'Failed to create branch');
    } catch (e: any) { alert(e?.message || 'Error creating branch'); }
    setIsSubmitting(false);
  };

  const handleEditBranch = async () => {
    if (!showEdit) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch<any>(`/locations/${showEdit.id}`, showEdit.form);
      if (res.success) {
        apiCache.clear();
        fetchBranches();
        setShowEdit(null);
      } else alert(res.message || 'Failed to update branch');
    } catch (e: any) { alert(e?.message || 'Error updating branch'); }
    setIsSubmitting(false);
  };

  const assignDM = async (branchId: string) => {
    if (!selectedDM) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch<any>(`/locations/${branchId}/assign-manager`, { managerId: selectedDM });
      if (res.success || res.managerName) {
        apiCache.clear();
        fetchBranches();
        setShowAssignDM(null);
        setSelectedDM('');
      } else alert(res.message || 'Failed to assign DM');
    } catch (e: any) { alert(e?.message || 'Error assigning DM'); }
    setIsSubmitting(false);
  };

  const unassignDM = async (branchId: string) => {
    if (!window.confirm('Remove the District Manager from this branch?')) return;
    try {
      await api.patch<any>(`/locations/${branchId}/unassign-manager`, {});
      apiCache.clear();
      fetchBranches();
    } catch (e) {}
  };

  const addStaffToBranch = async (branchId: string) => {
    if (!staffForm.personId) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch<any>(`/people/${staffForm.personId}`, { locationId: branchId });
      if (res.success === false) return alert(res.message || 'Failed to assign staff');
      apiCache.clear();
      fetchBranchStaff(branchId);
      fetchBranches();
      setShowAddStaff(null);
      setStaffForm({ personId: '' });
    } catch (e: any) { alert(e?.message || 'Error assigning staff'); }
    setIsSubmitting(false);
  };

  const toggleBranchActive = async (id: string) => {
    try {
      const res = await api.patch<any>(`/locations/${id}/toggle`, {});
      if (res.success || res.isActive !== undefined) {
        apiCache.clear();
        setBranches((prev) => prev.map((b) => b.id === id ? { ...b, isActive: res.isActive !== undefined ? res.isActive : !b.isActive } : b));
      }
    } catch (e: any) {}
  };

  const deleteBranch = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this hub? This action cannot be undone.')) return;
    try {
      const res = await api.delete<any>(`/locations/${id}`);
      if (res.success) {
        apiCache.clear();
        fetchBranches();
      } else alert(res.message || 'Failed to delete branch');
    } catch (e: any) { alert(e?.message || 'Error deleting branch'); }
  };

  const availableDMs = people.filter((p) => p.role === 'DISTRICT_MANAGER' && !branches.some((b) => b.manager_id === p.id));
  const availableStaff = people.filter((p) => (p.role === 'STAFF' || p.role === 'BROKER') && p.locationId !== showAddStaff);

  const activeBranches = branches.filter((b) => b.isActive).length;
  const totalStaff = branches.reduce((s, b) => s + (b.staffCount || 0), 0);
  const assignedDMs = branches.filter((b) => b.manager_id).length;

  const visibleBranches = role === 'GENERAL_MANAGER' ? branches : branches.filter((b) => {
    const myId = session?.user?.id;
    return b.manager_id === myId || people.find((p) => p.id === myId)?.locationId === b.id;
  });

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Network Architecture</h1>
          <p className="text-[13px] text-text-muted/80 font-medium mt-1">
            Global management of regional hubs and operational structure.
          </p>
        </div>
        
        {role === 'GENERAL_MANAGER' && (
          <Button
            variant="primary"
            onClick={() => setShowCreate(true)}
            className="h-11 px-6 shadow-xl active:scale-95 transition-all bg-text-main text-bg font-bold w-full md:w-auto"
          >
            <Plus size={16} className="mr-2" /> Initialize Hub
          </Button>
        )}
      </div>

      {/* KPIs */}
      <MobileKpis branches={branches.length} activeBranches={activeBranches} assignedDMs={assignedDMs} totalStaff={totalStaff} />

      {/* Main Content */}
      <DesktopTable 
        branches={visibleBranches} 
        expandedBranch={expandedBranch}
        branchStaff={branchStaff}
        role={role}
        onToggleExpand={toggleExpand}
        onToggleActive={toggleBranchActive}
        onDeleteBranch={deleteBranch}
        onUnassignDM={unassignDM}
        onShowAssignDM={(id) => { setShowAssignDM(id); setSelectedDM(''); }}
        onShowAddStaff={(id) => { setShowAddStaff(id); setStaffForm({ personId: '' }); }}
        onShowEdit={(branch) => setShowEdit({ id: branch.id, form: { name: branch.name, code: branch.code || '', address: branch.address || '', phone: branch.phone || '' } })}
      />
      <MobileGrid 
        branches={visibleBranches}
        expandedBranch={expandedBranch}
        branchStaff={branchStaff}
        role={role}
        onToggleExpand={toggleExpand}
        onToggleActive={toggleBranchActive}
        onDeleteBranch={deleteBranch}
        onUnassignDM={unassignDM}
        onShowAssignDM={(id) => { setShowAssignDM(id); setSelectedDM(''); }}
        onShowAddStaff={(id) => { setShowAddStaff(id); setStaffForm({ personId: '' }); }}
        onShowEdit={(branch) => setShowEdit({ id: branch.id, form: { name: branch.name, code: branch.code || '', address: branch.address || '', phone: branch.phone || '' } })}
      />

      {/* Modals */}
      <CreateBranchModal isOpen={showCreate} onClose={() => setShowCreate(false)} form={form} setForm={setForm} onSubmit={handleCreateBranch} isSubmitting={isSubmitting} />
      <EditBranchModal isOpen={!!showEdit} onClose={() => setShowEdit(null)} form={showEdit?.form || {}} setForm={(f: any) => setShowEdit({ ...showEdit, form: f })} onSubmit={handleEditBranch} isSubmitting={isSubmitting} />
      <AssignDMModal isOpen={!!showAssignDM} onClose={() => setShowAssignDM(null)} availableDMs={availableDMs} selectedDM={selectedDM} setSelectedDM={setSelectedDM} onSubmit={() => showAssignDM && assignDM(showAssignDM)} isSubmitting={isSubmitting} />
      <AssignStaffModal isOpen={!!showAddStaff} onClose={() => setShowAddStaff(null)} availableStaff={availableStaff} staffForm={staffForm} setStaffForm={setStaffForm} onSubmit={() => showAddStaff && addStaffToBranch(showAddStaff)} isSubmitting={isSubmitting} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const MobileKpis = ({ branches, activeBranches, assignedDMs, totalStaff }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
    <KpiTile label="Total Branches" value={branches} icon={<Globe size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    <KpiTile label="Operational" value={activeBranches} icon={<Activity size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    <KpiTile label="Assigned DMs" value={assignedDMs} icon={<Crown size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    <KpiTile label="Total Personnel" value={totalStaff} icon={<Users size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
  </div>
);

const DesktopTable = ({ branches, expandedBranch, branchStaff, role, onToggleExpand, onToggleActive, onDeleteBranch, onUnassignDM, onShowAssignDM, onShowAddStaff, onShowEdit }: any) => (
  <div className="bg-surface-card rounded-[24px] shadow-sm border border-border-subtle/30 p-2 hidden md:block">
    <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
      <h2 className="text-[14px] font-black text-text-main">Regional Architecture Ledger</h2>
      <p className="text-[12px] text-text-muted/60 font-medium">Official documentation of operational hubs and personnel</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-text-muted font-medium text-[12px] uppercase tracking-wider">
            <th className="pb-4 pt-6 px-4">Hub Designation</th>
            <th className="pb-4 pt-6 px-4">Leadership</th>
            <th className="pb-4 pt-6 px-4">Personnel</th>
            <th className="pb-4 pt-6 px-4 text-center">Status</th>
            <th className="pb-4 pt-6 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch: any) => (
            <React.Fragment key={branch.id}>
              <tr 
                className={cn("group transition-all cursor-pointer", !branch.isActive && 'opacity-60')}
                onClick={() => onToggleExpand(branch.id)}
              >
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[12px] bg-primary-main/10 flex items-center justify-center border border-primary-main/10 shrink-0">
                      <Building2 size={16} className="text-primary-main" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-text-main font-bold text-[14px] tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                        {branch.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-mono border shadow-sm">{branch.code}</Badge>
                        <span className="text-[11px] text-text-muted font-medium flex items-center gap-1"><MapPin size={10} /> {branch.address || 'No Address'}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  {branch.managerName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[10px] bg-warning/10 flex items-center justify-center border border-warning/20">
                        <Crown size={14} className="text-warning" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-text-main tracking-tight leading-none">{branch.managerName}</p>
                        <p className="text-[10px] text-warning font-bold uppercase tracking-wider">District Manager</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[12px] font-bold text-error-main bg-error-main/10 px-2 py-1 rounded-lg w-fit border border-error-main/20">
                      <ShieldCheck size={12} /> No Leadership
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center gap-2 bg-bg-base border border-border-subtle/30 rounded-xl px-3 py-1.5 w-fit shadow-sm">
                    <Users size={14} className="text-text-muted/80" />
                    <span className="text-[14px] font-black text-text-main leading-none">{branch.staffCount || 0}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Staff</span>
                  </div>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all text-center">
                  <Badge variant={branch.isActive ? 'primary' : 'warning'} className="text-[11px] uppercase tracking-wider font-bold shadow-sm border">
                    {branch.isActive ? 'Operational' : 'Suspended'}
                  </Badge>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center justify-end gap-2 text-text-muted/60 transition-transform duration-300">
                    <ChevronDown size={20} className={cn("transition-transform duration-300", expandedBranch === branch.id && "rotate-180")} />
                  </div>
                </td>
              </tr>
              {expandedBranch === branch.id && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="bg-bg-base border border-border-subtle/30 rounded-2xl mx-4 mb-4 mt-2 p-6 shadow-inner animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[14px] font-black text-text-main flex items-center gap-2"><Network size={16} className="text-text-muted" /> Roster Configuration</h3>
                        <div className="flex gap-2">
                          {role === 'GENERAL_MANAGER' && (
                            branch.managerName ? (
                              <Button variant="outline" size="sm" onClick={() => onUnassignDM(branch.id)} className="h-9 text-[11px] font-bold rounded-xl border-warning/20 text-warning hover:bg-warning/10"><X size={12} className="mr-1.5" /> Remove DM</Button>
                            ) : (
                              <Button variant="primary" size="sm" onClick={() => onShowAssignDM(branch.id)} className="h-9 text-[11px] font-bold rounded-xl bg-warning hover:bg-warning/90 text-bg"><Crown size={12} className="mr-1.5" /> Appoint DM</Button>
                            )
                          )}
                          <Button variant="outline" size="sm" onClick={() => onShowAddStaff(branch.id)} className="h-9 text-[11px] font-bold rounded-xl bg-surface-card border-border-subtle/30 shadow-sm"><UserPlus size={12} className="mr-1.5" /> Add Staff</Button>
                          <Button variant="outline" size="sm" onClick={() => onShowEdit(branch)} className="h-9 text-[11px] font-bold rounded-xl bg-surface-card border-border-subtle/30 shadow-sm"><Edit size={12} className="mr-1.5" /> Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => onToggleActive(branch.id)} className="h-9 text-[11px] font-bold rounded-xl bg-surface-card border-border-subtle/30 shadow-sm"><Power size={12} className="mr-1.5" /> Toggle Power</Button>
                          {role === 'GENERAL_MANAGER' && (
                            <Button variant="outline" size="sm" onClick={() => onDeleteBranch(branch.id)} className="h-9 text-[11px] font-bold rounded-xl border-error-main/20 text-error-main hover:bg-error-main/10"><Trash2 size={12} className="mr-1.5" /> Delete Hub</Button>
                          )}
                        </div>
                      </div>
                      
                      {!branchStaff[branch.id] ? (
                        <div className="animate-pulse text-center text-text-muted/60 text-[12px] font-bold uppercase tracking-wider py-8">Fetching Data...</div>
                      ) : branchStaff[branch.id].length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-border-subtle/30 rounded-xl">
                          <Users size={24} className="mx-auto text-text-muted/20 mb-2" />
                          <p className="text-[13px] font-bold text-text-muted/60">No Personnel Assigned</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {branchStaff[branch.id].map((staff: any) => (
                            <div key={staff.id} className="bg-surface-card border border-border-subtle/30 rounded-[14px] p-4 flex items-center gap-3 shadow-sm hover:border-primary-main/20 transition-all">
                              <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-[12px] border shrink-0", staff.isActive ? "bg-primary-main/10 text-primary-main border-primary-main/10" : "bg-bg-secondary text-text-muted border-border-subtle/30")}>
                                {staff.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-text-main truncate">{staff.fullName}</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider truncate">{staff.role.replace(/_/g, ' ')}</p>
                              </div>
                              {staff.phone && <a href={`tel:${staff.phone}`} className="text-text-muted/60 hover:text-primary-main"><Phone size={14} /></a>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MobileGrid = ({ branches, expandedBranch, branchStaff, role, onToggleExpand, onToggleActive, onDeleteBranch, onUnassignDM, onShowAssignDM, onShowAddStaff, onShowEdit }: any) => (
  <div className="flex flex-col gap-3 md:hidden">
    <div className="flex items-center justify-between px-1">
      <p className="text-[15px] font-black text-text-main">Regional Hubs</p>
      <span className="text-[12px] font-bold text-text-muted bg-bg-secondary px-2 py-1 rounded-md">{branches.length} Nodes</span>
    </div>
    <div className="flex flex-col gap-4">
      {branches.map((branch: any) => (
        <div key={branch.id} className={cn("bg-surface-card rounded-[20px] border shadow-sm transition-all overflow-hidden flex flex-col", branch.isActive ? "border-border-subtle/30" : "border-border-subtle/30 opacity-70 grayscale-[0.3]")}>
          {/* Header */}
          <div className="p-5 flex items-start justify-between border-b border-border-subtle/30 bg-bg-secondary/30" onClick={() => onToggleExpand(branch.id)}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-primary-main/10 flex items-center justify-center border border-primary-main/10 shrink-0 shadow-inner">
                <Building2 size={20} className="text-primary-main" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-main leading-tight tracking-tight flex items-center gap-2">
                  {branch.name}
                  <ChevronDown size={14} className={cn("text-text-muted/60 transition-transform", expandedBranch === branch.id && "rotate-180")} />
                </h3>
                <p className="text-[11px] text-text-muted font-mono mt-1 flex items-center gap-1.5"><Badge variant="default" className="text-[9px] px-1 py-0 border">{branch.code}</Badge></p>
              </div>
            </div>
            <Badge variant={branch.isActive ? 'primary' : 'warning'} className="text-[10px] uppercase font-bold border shadow-sm">
              {branch.isActive ? 'Active' : 'Suspended'}
            </Badge>
          </div>

          {/* Details (Always visible) */}
          <div className="p-4 grid grid-cols-2 gap-4 bg-surface-card">
            <div className="col-span-2 flex items-center gap-2 text-[12px] font-bold text-text-muted/80">
              <MapPin size={12} /> {branch.address || 'Address Not Provided'}
            </div>
            <div className="border border-border-subtle/30 rounded-xl p-3 bg-bg-secondary/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Leadership</p>
              {branch.managerName ? (
                <div className="flex items-center gap-2 text-[13px] font-bold text-text-main"><Crown size={12} className="text-warning" /> {branch.managerName.split(' ')[0]}</div>
              ) : (
                <div className="text-[11px] font-bold text-error-main">Unassigned</div>
              )}
            </div>
            <div className="border border-border-subtle/30 rounded-xl p-3 bg-bg-secondary/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Personnel</p>
              <div className="flex items-center gap-2 text-[13px] font-bold text-text-main"><Users size={12} className="text-text-muted" /> {branch.staffCount || 0} Staff</div>
            </div>
          </div>

          {/* Expanded State */}
          {expandedBranch === branch.id && (
            <div className="p-4 border-t border-border-subtle/30 bg-bg-base/50 flex flex-col gap-4 animate-in slide-in-from-top-2">
              <div className="flex flex-wrap gap-2">
                {role === 'GENERAL_MANAGER' && (
                  branch.managerName ? 
                    <Button variant="outline" size="sm" onClick={() => onUnassignDM(branch.id)} className="h-9 flex-1 text-[11px] border-warning/20 text-warning">Drop DM</Button> :
                    <Button variant="primary" size="sm" onClick={() => onShowAssignDM(branch.id)} className="h-9 flex-1 text-[11px] bg-warning text-bg border-none shadow-sm">Assign DM</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onShowAddStaff(branch.id)} className="h-9 flex-1 text-[11px] bg-surface-card">Add Staff</Button>
                <Button variant="outline" size="sm" onClick={() => onShowEdit(branch)} className="h-9 w-10 p-0 flex items-center justify-center shrink-0 bg-surface-card"><Edit size={14} /></Button>
                <Button variant="outline" size="sm" onClick={() => onToggleActive(branch.id)} className="h-9 w-10 p-0 flex items-center justify-center shrink-0 bg-surface-card"><Power size={14} /></Button>
                {role === 'GENERAL_MANAGER' && (
                  <Button variant="outline" size="sm" onClick={() => onDeleteBranch(branch.id)} className="h-9 w-10 p-0 flex items-center justify-center shrink-0 border-error-main/20 text-error-main"><Trash2 size={14} /></Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1 border-l-2 border-primary-main/50 pl-2">Roster Roster</p>
                {!branchStaff[branch.id] ? (
                  <div className="text-[11px] text-center text-text-muted py-4">Loading...</div>
                ) : branchStaff[branch.id].length === 0 ? (
                  <div className="text-[11px] text-center text-text-muted/60 py-4 border border-dashed border-border-subtle/30 rounded-xl">Empty Roster</div>
                ) : (
                  branchStaff[branch.id].map((staff: any) => (
                    <div key={staff.id} className="flex items-center gap-3 bg-surface-card border border-border-subtle/30 rounded-[12px] p-3 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center font-bold text-[11px] text-text-muted">{staff.fullName?.substring(0,2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-text-main truncate">{staff.fullName}</p>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{staff.role.replace(/_/g, ' ')}</p>
                      </div>
                      {staff.phone && <a href={`tel:${staff.phone}`} className="text-text-muted/60"><Phone size={14} /></a>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Modals
const CreateBranchModal = ({ isOpen, onClose, form, setForm, onSubmit, isSubmitting }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Register New Hub" subtitle="Initialize a regional operations facility" maxWidth="max-w-md">
    <div className="space-y-5">
      <TextField label="Designation" placeholder="e.g. Kazanchis Hub" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <TextField label="System Code" placeholder="e.g. KAZ-01" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
      <TextField label="Physical Address" placeholder="Addis Ababa, ET" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      <TextField label="Operational Contact" placeholder="+251 ..." value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 h-12 rounded-xl border-border-subtle/30 shadow-sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" className="flex-1 h-12 rounded-xl bg-text-main text-bg shadow-xl active:scale-95 transition-all" disabled={!form.name || isSubmitting} loading={isSubmitting} onClick={onSubmit}>Initialize</Button>
      </div>
    </div>
  </Modal>
);

const EditBranchModal = ({ isOpen, onClose, form, setForm, onSubmit, isSubmitting }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Update Hub Settings" subtitle="Modify existing branch details" maxWidth="max-w-md">
    <div className="space-y-5">
      <TextField label="Designation" placeholder="e.g. Kazanchis Hub" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} />
      <TextField label="System Code" placeholder="e.g. KAZ-01" value={form.code || ''} onChange={(v) => setForm({ ...form, code: v })} />
      <TextField label="Physical Address" placeholder="Addis Ababa, ET" value={form.address || ''} onChange={(v) => setForm({ ...form, address: v })} />
      <TextField label="Operational Contact" placeholder="+251 ..." value={form.phone || ''} onChange={(v) => setForm({ ...form, phone: v })} />
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 h-12 rounded-xl border-border-subtle/30 shadow-sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" className="flex-1 h-12 rounded-xl bg-text-main text-bg shadow-xl active:scale-95 transition-all" disabled={!form.name || isSubmitting} loading={isSubmitting} onClick={onSubmit}>Save Changes</Button>
      </div>
    </div>
  </Modal>
);

const AssignDMModal = ({ isOpen, onClose, availableDMs, selectedDM, setSelectedDM, onSubmit, isSubmitting }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Appoint District Manager" subtitle="Assign a leader to this branch" maxWidth="max-w-md">
    <div className="space-y-4">
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {availableDMs.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-[13px] border border-dashed rounded-xl">No available managers.</div>
        ) : availableDMs.map((dm: any) => (
          <button key={dm.id} onClick={() => setSelectedDM(dm.id)} className={cn("w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left", selectedDM === dm.id ? "border-warning bg-warning/5 shadow-sm" : "border-border-subtle/30 bg-surface-card")}>
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 shrink-0"><Crown size={16} className="text-warning" /></div>
            <div className="flex-1"><p className="text-[13px] font-bold text-text-main">{dm.fullName}</p><p className="text-[11px] text-text-muted">{dm.phone}</p></div>
            {selectedDM === dm.id && <div className="w-3 h-3 rounded-full bg-warning" />}
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 h-12 rounded-xl shadow-sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" className="flex-1 h-12 rounded-xl bg-warning hover:bg-warning/90 text-bg shadow-lg shadow-warning/20" disabled={!selectedDM || isSubmitting} loading={isSubmitting} onClick={onSubmit}>Appoint DM</Button>
      </div>
    </div>
  </Modal>
);

const AssignStaffModal = ({ isOpen, onClose, availableStaff, staffForm, setStaffForm, onSubmit, isSubmitting }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Transfer Personnel" subtitle="Reassign staff to this branch" maxWidth="max-w-md">
    <div className="space-y-4">
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {availableStaff.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-[13px] border border-dashed rounded-xl">No available staff.</div>
        ) : availableStaff.map((staff: any) => (
          <button key={staff.id} onClick={() => setStaffForm({ personId: staff.id })} className={cn("w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left", staffForm.personId === staff.id ? "border-primary-main bg-primary-main/5 shadow-sm" : "border-border-subtle/30 bg-surface-card")}>
            <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center shrink-0 border border-border-subtle/30"><Briefcase size={16} className="text-text-muted" /></div>
            <div className="flex-1"><p className="text-[13px] font-bold text-text-main">{staff.fullName}</p><p className="text-[11px] text-text-muted">{staff.role.replace(/_/g, ' ')}</p></div>
            {staffForm.personId === staff.id && <div className="w-3 h-3 rounded-full bg-primary-main" />}
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 h-12 rounded-xl shadow-sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" className="flex-1 h-12 rounded-xl bg-text-main text-bg shadow-xl" disabled={!staffForm.personId || isSubmitting} loading={isSubmitting} onClick={onSubmit}>Transfer</Button>
      </div>
    </div>
  </Modal>
);
