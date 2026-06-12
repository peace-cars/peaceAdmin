import { useState, useEffect } from 'react';
import { UserPlus, MapPin, Power, X, Users, ShieldCheck, Zap, Building2, Edit, Network, Phone, Star } from 'lucide-react';
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

export default function PeopleManagement() {
  const { session } = useAuth();
  const [people, setPeople] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [showCreate, setShowCreate] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    role: 'STAFF',
    branchId: '',
    commissionTier: '1.0',
  });

  useEffect(() => {
    if (!session) return;
    
    fetchWithCache('/people', {}, (data) => {
      if (Array.isArray(data)) setPeople(data);
      else setPeople([]);
    }).catch(err => {
      console.error(err);
      setPeople([]);
    });

    fetchWithCache('/locations', {}, (data) => {
      if (Array.isArray(data)) setBranches(data);
      else setBranches([]);
    }).catch(err => {
      console.error(err);
      setBranches([]);
    });
  }, [session]);

  const handleCreate = async () => {
    if (!session) return;
    setIsSubmitting(true);
    const branch = branches.find((b: any) => b.id === form.branchId);
    try {
      const payload: any = {
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
        locationName: branch?.name || '',
        commissionTier: Number(form.commissionTier),
      };

      if (form.branchId && form.branchId.trim() !== '') {
        payload.branch_id = form.branchId;
      }

      const data: any = await api.post('/people', payload);
      if (data && data.person) {
        apiCache.clear();
        setPeople((prev) =>
          [data.person, ...prev].map((p) =>
            p.id === data.person.id ? { ...p, locationName: branch?.name || 'Assigned' } : p,
          ),
        );
        setShowCreate(false);
        setForm({ fullName: '', phone: '', role: 'STAFF', branchId: '', commissionTier: '1.0' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!session || !editingPerson) return;
    setIsSubmitting(true);
    const branch = branches.find((b: any) => b.id === form.branchId);
    try {
      const payload: any = {
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
        commissionTier: Number(form.commissionTier),
      };

      if (form.branchId && form.branchId.trim() !== '') {
        payload.branch_id = form.branchId;
      }

      await api.patch(`/people/${editingPerson.id}`, payload);
      apiCache.clear();
      
      setPeople((prev) =>
        prev.map((p) =>
          p.id === editingPerson.id
            ? {
                ...p,
                fullName: form.fullName,
                phone: form.phone,
                role: form.role,
                branch_id: form.branchId,
                branchId: form.branchId,
                locationName: branch?.name || 'Updated',
                commissionTier: Number(form.commissionTier),
              }
            : p,
        ),
      );
      setShowCreate(false);
      setEditingPerson(null);
      setForm({ fullName: '', phone: '', role: 'STAFF', branchId: '', commissionTier: '1.0' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (person: any) => {
    setEditingPerson(person);
    setForm({
      fullName: person.fullName,
      phone: person.phone,
      role: person.role,
      branchId: person.branchId || person.branch_id || '',
      commissionTier: (person.commissionTier || 1.0).toString(),
    });
    setShowCreate(true);
  };

  const toggleActive = async (id: string) => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      const data: any = await api.patch(`/people/${id}/toggle`, {});
      if (data && typeof data.isActive !== 'undefined') {
        apiCache.clear();
        setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: data.isActive } : p)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStaff = people.filter((p) => p.isActive).length;
  const dmCount = people.filter((p) => p.role === 'DISTRICT_MANAGER').length;

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Personnel Roster</h1>
          <p className="text-[13px] text-text-muted/80 font-medium mt-1">
            Global directory and access control for system operators.
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => {
            setEditingPerson(null);
            setForm({ fullName: '', phone: '', role: 'STAFF', branchId: '', commissionTier: '1.0' });
            setShowCreate(true);
          }}
          className="h-11 px-6 shadow-xl active:scale-95 transition-all bg-text-main text-bg font-bold w-full md:w-auto"
        >
          <UserPlus size={16} className="mr-2" /> Onboard Personnel
        </Button>
      </div>

      {/* KPIs */}
      <MobileKpis people={people.length} activeStaff={activeStaff} dmCount={dmCount} networkHealth="Optimal" />

      {/* Main Content */}
      <DesktopTable 
        people={people} 
        onEdit={openEdit}
        onToggleActive={toggleActive}
      />
      <MobileGrid 
        people={people}
        onEdit={openEdit}
        onToggleActive={toggleActive}
      />

      {/* Action Modal */}
      <PersonnelModal 
        isOpen={showCreate} 
        onClose={() => { setShowCreate(false); setEditingPerson(null); }} 
        form={form} 
        setForm={setForm} 
        branches={branches}
        isEditing={!!editingPerson}
        onSubmit={editingPerson ? handleUpdate : handleCreate} 
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const RoleBadge = ({ role }: { role: string }) => {
  if (role === 'GENERAL_MANAGER')
    return <Badge variant="primary" className="text-[10px] uppercase font-bold border shadow-sm">General Manager</Badge>;
  if (role === 'DISTRICT_MANAGER')
    return <Badge variant="warning" className="text-[10px] uppercase font-bold border shadow-sm">Branch Overseer</Badge>;
  return <Badge variant="default" className="text-[10px] uppercase font-bold border shadow-sm bg-bg-secondary text-text-muted">Operations Staff</Badge>;
};

const MobileKpis = ({ people, activeStaff, dmCount, networkHealth }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
    <KpiTile label="Total Workforce" value={people} icon={<Users size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    <KpiTile label="Active Status" value={activeStaff} icon={<ShieldCheck size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    <KpiTile label="Branch Leads" value={dmCount} icon={<Building2 size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
    <KpiTile label="Network Health" value={networkHealth} icon={<Zap size={14} />} className="rounded-2xl md:rounded-[20px] p-4 h-24 md:h-28" />
  </div>
);

const DesktopTable = ({ people, onEdit, onToggleActive }: any) => (
  <div className="bg-surface-card rounded-[24px] shadow-sm border border-border-subtle/30 p-2 hidden md:block">
    <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
      <h2 className="text-[14px] font-black text-text-main">Global Registry Ledger</h2>
      <p className="text-[12px] text-text-muted/60 font-medium">Official documentation of all registered system operators</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-text-muted font-medium text-[12px] uppercase tracking-wider">
            <th className="pb-4 pt-6 px-4">Entity Profile</th>
            <th className="pb-4 pt-6 px-4">Operational Role</th>
            <th className="pb-4 pt-6 px-4">Assigned Hub</th>
            <th className="pb-4 pt-6 px-4 text-center">Status</th>
            <th className="pb-4 pt-6 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p: any) => (
            <tr key={p.id} className={cn("group transition-all", !p.isActive && 'opacity-60 grayscale-[0.3]')}>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-bg-base border border-border-subtle flex items-center justify-center shrink-0 shadow-inner">
                    <UserPlus size={16} className="text-text-muted/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-main font-bold text-[14px] tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                      {p.fullName}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-text-muted font-mono bg-bg-secondary px-2 py-0.5 rounded-md w-fit border border-border-subtle/30 uppercase">
                        ID: {p.id.substring(0, 6)}
                      </p>
                      {p.phone && <a href={`tel:${p.phone}`} className="text-[11px] text-text-muted font-mono flex items-center gap-1 hover:text-primary-main"><Phone size={10} /> {p.phone}</a>}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="space-y-1">
                  <RoleBadge role={p.role} />
                  <p className="text-[11px] text-text-muted/80 font-medium flex items-center gap-1.5 mt-1">
                    <Star size={10} /> {p.commissionTier}x Multiplier
                  </p>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center gap-2 bg-bg-base border border-border-subtle/30 rounded-xl px-3 py-1.5 w-fit shadow-sm">
                  <MapPin size={14} className="text-primary-main/60" />
                  <span className="text-[12px] font-bold text-text-main">{p.locationName || 'Unassigned'}</span>
                </div>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all text-center">
                <Badge variant={p.isActive ? 'primary' : 'warning'} className="text-[11px] uppercase tracking-wider font-bold shadow-sm border">
                  {p.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </td>
              <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                <div className="flex items-center justify-end gap-2">
                  <Tooltip content="Edit Profile">
                    <button onClick={() => onEdit(p)} disabled={p.isSubmitting} className="w-9 h-9 flex items-center justify-center bg-bg-base border border-border-subtle/30 rounded-xl text-text-muted hover:text-text-main transition-colors active:scale-95 shadow-sm disabled:opacity-50">
                      <Edit size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip content={p.isActive ? "Suspend Access" : "Restore Access"}>
                    <button onClick={() => onToggleActive(p.id)} disabled={p.isSubmitting} className={cn("w-9 h-9 flex items-center justify-center border rounded-xl transition-colors active:scale-95 shadow-sm disabled:opacity-50", p.isActive ? "bg-bg-base border-border-subtle/30 text-error-main hover:bg-error-main/10 hover:border-error-main/30" : "bg-success text-white border-success/20 hover:bg-success/90")}>
                      <Power size={14} />
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

const MobileGrid = ({ people, onEdit, onToggleActive }: any) => (
  <div className="flex flex-col gap-3 md:hidden">
    <div className="flex items-center justify-between px-1">
      <p className="text-[15px] font-black text-text-main">Registry Queue</p>
      <span className="text-[12px] font-bold text-text-muted bg-bg-secondary px-2 py-1 rounded-md">{people.length} Entities</span>
    </div>
    <div className="flex flex-col gap-4">
      {people.map((p: any) => (
        <div key={p.id} className={cn("bg-surface-card rounded-[20px] border shadow-sm transition-all overflow-hidden flex flex-col", p.isActive ? "border-border-subtle/30" : "border-border-subtle/30 opacity-70 grayscale-[0.3]")}>
          {/* Header */}
          <div className="p-5 flex items-start justify-between border-b border-border-subtle/30 bg-bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-bg-base flex items-center justify-center border border-border-subtle shrink-0 shadow-inner">
                <UserPlus size={20} className="text-text-muted/60" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-main leading-tight tracking-tight">
                  {p.fullName}
                </h3>
                <p className="text-[11px] text-text-muted font-mono mt-1 uppercase">ID: {p.id.substring(0, 6)}</p>
              </div>
            </div>
            <Badge variant={p.isActive ? 'primary' : 'warning'} className="text-[10px] uppercase font-bold border shadow-sm">
              {p.isActive ? 'Active' : 'Suspended'}
            </Badge>
          </div>

          {/* Details */}
          <div className="p-4 grid grid-cols-2 gap-4 bg-surface-card">
            <div className="col-span-2 flex justify-between items-center bg-bg-secondary/50 rounded-xl p-3 border border-border-subtle/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Hub</span>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-text-main">
                <MapPin size={12} className="text-primary-main/60" />
                {p.locationName || 'Unassigned'}
              </div>
            </div>
            <div className="border border-border-subtle/30 rounded-xl p-3 bg-bg-secondary/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Designation</p>
              <RoleBadge role={p.role} />
            </div>
            <div className="border border-border-subtle/30 rounded-xl p-3 bg-bg-secondary/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Index Multiplier</p>
              <p className="text-[14px] font-black text-text-main font-mono">{p.commissionTier}x</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border-subtle/30 bg-bg-base flex items-center justify-end gap-2">
            <button onClick={() => onEdit(p)} disabled={p.isSubmitting} className="flex-1 flex justify-center items-center gap-2 h-11 bg-surface-card border border-border-subtle/30 rounded-[12px] text-text-main font-bold text-[12px] hover:bg-bg-secondary shadow-sm disabled:opacity-50">
              <Edit size={14} /> Modify Data
            </button>
            <button onClick={() => onToggleActive(p.id)} disabled={p.isSubmitting} className={cn("flex items-center justify-center w-12 h-11 border rounded-[12px] shadow-sm disabled:opacity-50", p.isActive ? "bg-surface-card border-border-subtle/30 text-error-main hover:bg-error-main/10" : "bg-success text-white border-success/20 hover:bg-success/90")}>
              <Power size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Modals
const PersonnelModal = ({ isOpen, onClose, form, setForm, branches, isEditing, onSubmit, isSubmitting }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Update Personnel' : 'Personnel Onboarding'} subtitle="Registry credentials and hub assignment." maxWidth="max-w-md">
    <div className="space-y-5">
      <TextField label="Full Legal Name" placeholder="e.g. Abebe Bikila" value={form.fullName} onChange={(v) => setForm((p:any) => ({ ...p, fullName: v }))} />
      <TextField label="Operational Contact" placeholder="+251 ..." value={form.phone} onChange={(v) => setForm((p:any) => ({ ...p, phone: v }))} />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Assigned Role"
          options={[{ value: 'STAFF', label: 'Operations Staff' }, { value: 'DISTRICT_MANAGER', label: 'Branch Overseer' }]}
          value={form.role}
          onChange={(v) => setForm((p:any) => ({ ...p, role: v }))}
        />
        <TextField
          label="Tier Index"
          type="number"
          step="0.1"
          value={form.commissionTier}
          onChange={(v) => setForm((p:any) => ({ ...p, commissionTier: v }))}
        />
      </div>

      <SelectField
        label="Registry Hub"
        options={[
          { value: '', label: 'Select branch hub...' },
          ...branches.filter((b: any) => b.is_active || b.isActive).map((b: any) => ({ value: b.id, label: b.name })),
        ]}
        value={form.branchId}
        onChange={(v) => setForm((p:any) => ({ ...p, branchId: v }))}
      />

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 h-12 rounded-xl border-border-subtle/30 shadow-sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" className="flex-1 h-12 rounded-xl bg-text-main text-bg shadow-xl active:scale-95 transition-all" disabled={!form.fullName || !form.phone || !form.branchId || isSubmitting} loading={isSubmitting} onClick={onSubmit}>
          {isEditing ? 'Update Registry' : 'Authorize Entity'}
        </Button>
      </div>
    </div>
  </Modal>
);
