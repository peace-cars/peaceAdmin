import { useState, useEffect } from 'react';
import { UserPlus, MapPin, Power, X, Users, ShieldCheck, Zap, Building2, Edit } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache } from '../lib/cache';
import { KpiTile } from '../components/ui/KpiTile';
import { SectionCard } from '../components/ui/SectionCard';
import { Button } from '../components/ui/Button';
import { TextField, SelectField } from '../components/ui/FormControls';
import { cn } from '../lib/utils';

export default function PeopleManagement() {
  const { session } = useAuth();
  const [people, setPeople] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
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
    const branch = branches.find((b: any) => b.id === form.branchId);
    try {
      const data: any = await api.post('/people', {
        ...form,
        locationName: branch?.name || '',
        commissionTier: Number(form.commissionTier),
      });
      if (data && data.person) {
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
    }
  };

  const handleUpdate = async () => {
    if (!session || !editingPerson) return;
    const branch = branches.find((b: any) => b.id === form.branchId);
    try {
      const payload: any = {
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
        commissionTier: Number(form.commissionTier),
      };

      if (form.branchId && form.branchId.trim() !== '') {
        payload.branchId = form.branchId;
      }

      await api.patch(`/people/${editingPerson.id}`, payload);
      
      setPeople((prev) =>
        prev.map((p) =>
          p.id === editingPerson.id
            ? {
                ...p,
                fullName: form.fullName,
                phone: form.phone,
                role: form.role,
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
    try {
      const data: any = await api.patch(`/people/${id}/toggle`, {});
      if (data && typeof data.isActive !== 'undefined') {
        setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: data.isActive } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'GENERAL_MANAGER')
      return (
        <span className="bg-primary-main/10 text-primary-main px-2 py-0.5 rounded text-[11px] font-medium border border-primary-main/20 shadow-sm">
          HQ General Manager
        </span>
      );
    if (role === 'DISTRICT_MANAGER')
      return (
        <span className="bg-warning/10 text-warning px-2 py-0.5 rounded text-[11px] font-bold border border-warning/20">
          Branch Overseer
        </span>
      );
    return (
      <span className="bg-bg-secondary text-text-muted/60 px-2 py-0.5 rounded text-[11px] font-bold border border-border-subtle/30">
        Operations Staff
      </span>
    );
  };

  const activeStaff = people.filter((p) => p.isActive).length;
  const dmCount = people.filter((p) => p.role === 'DISTRICT_MANAGER').length;

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile
          label="Total Workforce"
          value={people.length}
          icon={<Users size={14} />}
          className="rounded-xl p-4 h-28"
        />
        <KpiTile
          label="Active Status"
          value={activeStaff}
          icon={<ShieldCheck size={14} />}
          className="rounded-xl p-4 h-28"
        />
        <KpiTile
          label="Branch Leads"
          value={dmCount}
          icon={<Building2 size={14} />}
          className="rounded-xl p-4 h-28"
        />
        <KpiTile
          label="Network Health"
          value="Stable"
          icon={<Zap size={14} />}
          className="rounded-xl p-4 h-28"
        />
      </div>

      {/* Native Solid Personnel Grid/List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[14px] font-black text-text-main">Active Personnel</h2>
          <span className="text-[12px] font-bold text-text-muted bg-bg-secondary px-2 py-1 rounded-md">{people.length} Members</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {people.map((p) => (
            <div
              key={p.id}
              className={cn(
                'bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col transition-transform active:scale-[0.98]',
                !p.isActive && 'opacity-60 grayscale border-dashed bg-bg-secondary/50'
              )}
            >
              {/* Card Header area */}
              <div className="p-4 flex items-start justify-between border-b border-border-subtle bg-bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-bg-base border-2 border-border-subtle flex items-center justify-center shrink-0 shadow-inner">
                    <UserPlus size={20} className="text-text-muted" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-text-main leading-tight tracking-tight">
                      {p.fullName}
                    </h3>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5 uppercase">
                      ID: {p.id.substring(0, 6)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col gap-3 flex-1 bg-surface-card">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Role</span>
                  {roleBadge(p.role)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Hub</span>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-text-main bg-bg-secondary px-2 py-1 rounded-md">
                    <MapPin size={12} className="text-primary-main" />
                    {p.locationName || 'Unassigned'}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Tier</span>
                  <span className="text-[13px] font-black text-text-main font-mono">
                    {p.commissionTier}x
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-3 border-t border-border-subtle bg-bg-base flex items-center justify-end gap-2">
                <button
                  className="w-10 h-10 flex items-center justify-center bg-surface-card rounded-xl text-text-main hover:bg-bg-secondary border border-border-subtle shadow-sm transition-all active:scale-90"
                  onClick={() => openEdit(p)}
                  title="Edit Profile"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm border active:scale-90',
                    p.isActive
                      ? 'bg-surface-card text-error-main border-error-main/30 hover:bg-error-main/10'
                      : 'bg-success text-white border-success hover:bg-success/90'
                  )}
                  onClick={() => toggleActive(p.id)}
                  title={p.isActive ? "Deactivate" : "Activate"}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg-base/90 backdrop-blur-sm">
          <div className="bg-surface-card rounded-2xl p-8 w-full max-w-md shadow-2xl border border-border-subtle/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8 border-b border-border-subtle/30 pb-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-text-main tracking-tight leading-tight uppercase">
                  {editingPerson ? 'Update Personnel' : 'Personnel Onboarding'}
                </h2>
                <p className="text-[11px] text-text-muted/40 font-bold uppercase tracking-wider">
                  Registry credentials and hub assignment.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditingPerson(null);
                }}
                className="w-8 h-8 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-lg text-text-muted hover:text-text-main transition-colors"
              >
                ✕
              </button>
            </div>{' '}
            <div className="space-y-5">
              <TextField
                label="Full Legal Name"
                placeholder="e.g. Abebe Bikila"
                value={form.fullName}
                onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
              />
              <TextField
                label="Operational Contact"
                placeholder="+251 ..."
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Assigned Role"
                  options={[
                    { value: 'STAFF', label: 'Operations Staff' },
                    { value: 'DISTRICT_MANAGER', label: 'Branch Overseer' },
                  ]}
                  value={form.role}
                  onChange={(v) => setForm((p) => ({ ...p, role: v }))}
                />
                <TextField
                  label="Tier Index"
                  type="number"
                  step="0.1"
                  value={form.commissionTier}
                  onChange={(v) => setForm((p) => ({ ...p, commissionTier: v }))}
                />
              </div>

              <SelectField
                label="Registry Hub"
                options={[
                  { value: '', label: 'Select branch hub...' },
                  ...branches
                    .filter((b: any) => b.is_active)
                    .map((b: any) => ({ value: b.id, label: b.name })),
                ]}
                value={form.branchId}
                onChange={(v) => setForm((p) => ({ ...p, branchId: v }))}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl text-[12px] font-bold border-border-subtle/30 shadow-sm"
                  onClick={() => {
                    setShowCreate(false);
                    setEditingPerson(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-text-main text-bg h-11 rounded-xl text-[12px] font-bold shadow-xl active:scale-95 transition-all"
                  disabled={!form.fullName || !form.phone || !form.branchId}
                  onClick={editingPerson ? handleUpdate : handleCreate}
                >
                  {editingPerson ? 'Update Registry' : 'Authorize Entity'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface-card border border-border-subtle/30 p-6 rounded-xl shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="flex items-center gap-12 relative z-10">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-text-muted font-medium opacity-30">
              Operational Personnel
            </p>
            <p className="text-lg font-bold text-text-main tracking-tight leading-none">
              {people.length || 0}{' '}
              <span className="text-[13px] text-primary-main font-bold ml-1 font-medium">
                Active
              </span>
            </p>
          </div>
          <div className="w-px h-8 bg-border-subtle/30" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-text-muted font-medium opacity-30">
              Network Coverage
            </p>
            <p className="text-lg font-bold text-text-main tracking-tight leading-none">
              {branches.length || 0}{' '}
              <span className="text-[13px] text-primary-main font-bold ml-1 font-medium">Hubs</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-primary-main/10 opacity-20 group-hover:opacity-40 transition-opacity">
          <ShieldCheck size={20} />
          <Users size={20} />
          <Building2 size={20} />
          <Zap size={20} />
        </div>
      </div>
    </div>
  );
}
