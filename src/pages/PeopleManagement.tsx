import { useState, useEffect } from 'react';
import { UserPlus, MapPin, Power, X, Users, ShieldCheck, Zap, Building2, Edit } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { unwrapApiResponse } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
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
  const [form, setForm] = useState({ fullName: '', phone: '', role: 'STAFF', branchId: '', commissionTier: '1.0' });

  useEffect(() => {
    if (!session) return;
    const headers = { 'Authorization': `Bearer ${session.access_token}` };
    
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/people`, { headers })
      .then(r => r.json())
      .then(data => { const result = unwrapApiResponse(data); if (Array.isArray(result)) setPeople(result); else setPeople([]); })
      .catch(err => { console.error(err); setPeople([]); });
      
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/locations`, { headers })
      .then(r => r.json())
      .then(data => { const result = unwrapApiResponse(data); if (Array.isArray(result)) setBranches(result); else setBranches([]); })
      .catch(err => { console.error(err); setBranches([]); });
  }, [session]);

  const handleCreate = async () => {
    if (!session) return;
    const branch = branches.find((b: any) => b.id === form.branchId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/people`, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ ...form, locationName: branch?.name || '', commissionTier: Number(form.commissionTier) })
      });
      const data = await res.json();
      if (data.success) { 
        setPeople(prev => [data.person, ...prev].map(p => p.id === data.person.id ? { ...p, locationName: branch?.name || 'Assigned' } : p));
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
        commissionTier: Number(form.commissionTier)
      };
      
      if (form.branchId && form.branchId.trim() !== '') {
        payload.branchId = form.branchId;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/people/${editingPerson.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('[DIAGNOSTIC] Validation Failure:', errData);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setPeople(prev => prev.map(p => p.id === editingPerson.id ? { 
            ...p, 
            fullName: form.fullName, 
            phone: form.phone, 
            role: form.role, 
            branchId: form.branchId, 
            locationName: branch?.name || 'Updated',
            commissionTier: Number(form.commissionTier)
        } : p));
        setShowCreate(false);
        setEditingPerson(null);
        setForm({ fullName: '', phone: '', role: 'STAFF', branchId: '', commissionTier: '1.0' });
      }
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
      commissionTier: (person.commissionTier || 1.0).toString()
    });
    setShowCreate(true);
  };

  const toggleActive = async (id: string) => {
    if (!session) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/people/${id}/toggle`, { 
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPeople(prev => prev.map(p => p.id === id ? { ...p, isActive: data.isActive } : p));
      }
    } catch (err) {
       console.error(err);
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'GENERAL_MANAGER') return <span className="bg-primary-main/10 text-primary-main px-2 py-0.5 rounded text-[11px] font-medium border border-primary-main/20 shadow-sm">HQ General Manager</span>;
    if (role === 'DISTRICT_MANAGER') return <span className="bg-warning/10 text-warning px-2 py-0.5 rounded text-[11px] font-bold border border-warning/20">Branch Overseer</span>;
    return <span className="bg-bg-secondary text-text-muted/60 px-2 py-0.5 rounded text-[11px] font-bold border border-border-subtle/30">Operations Staff</span>;
  };

  const activeStaff = people.filter(p => p.isActive).length;
  const dmCount = people.filter(p => p.role === 'DISTRICT_MANAGER').length;

  return (
    <div className="space-y-6 pb-12">
      <div className="sticky top-0 z-40 -mx-4 md:-mx-8 -mt-5 md:-mt-8 px-4 md:px-8 py-4 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle/30 shadow-sm overflow-x-hidden">
        <PageHeader 
          title="Personnel Registry" 
          subtitle="Operational oversight of administrative and showroom personnel."
          icon={<Users size={18} className="text-primary-main" />}
          actions={
            <Button variant="primary" size="sm" onClick={() => { setEditingPerson(null); setShowCreate(true); setForm({ fullName: '', phone: '', role: 'STAFF', branchId: '', commissionTier: '1.0' }); }} className="rounded-xl h-11 px-6 bg-text-main text-bg font-bold text-[12px] shadow-xl active:scale-95 transition-all w-full md:w-auto">
              New Onboarding
            </Button>
          }
          className="pb-0"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Total Workforce" value={people.length} icon={<Users size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Active Status" value={activeStaff} icon={<ShieldCheck size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Branch Leads" value={dmCount} icon={<Building2 size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Network Health" value="Stable" icon={<Zap size={14} />} className="rounded-xl p-4 h-28" />
      </div>

      <div className="bg-surface-card rounded-xl border border-border-subtle/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-subtle/30 bg-bg-secondary/50 flex items-center justify-between">
           <h2 className="text-[12px] font-bold text-text-muted font-medium">Active Personnel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-text-muted font-medium border-b border-border-subtle/30 bg-bg-secondary/50">
                <th className="px-5 py-3 font-bold">Personnel Entity</th>
                <th className="px-5 py-3 font-bold">Assigned Role</th>
                <th className="px-5 py-3 font-bold">Registry Hub</th>
                <th className="px-5 py-3 font-bold">Tier Index</th>
                <th className="px-5 py-3 font-bold text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30">
              {people.map(p => (
                <tr key={p.id} className={cn("group transition-all hover:bg-bg-secondary/40", !p.isActive && 'opacity-60 bg-bg-secondary/20 grayscale border-dashed')}>
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-text-main group-hover:text-primary-main transition-colors leading-tight">{p.fullName}</p>
                    <p className="text-[7px] text-text-muted font-medium mt-0.5 font-mono">ID: {p.id.substring(0,8).toUpperCase()}</p>
                  </td>
                  <td className="px-5 py-3">
                    {roleBadge(p.role)}
                  </td>
                   <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-text-muted/60">
                      <MapPin size={10} className="text-primary-main/60" />
                      {p.locationName || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[13px] font-bold text-text-main font-mono">
                      {p.commissionTier} <span className="text-[11px] text-primary-main">x</span>
                    </span>
                  </td>
                   <td className="px-5 py-3 text-right">
                     <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        className="w-8 h-8 flex items-center justify-center bg-bg-secondary rounded-lg text-text-muted/60 hover:text-primary-main border border-border-subtle/30 shadow-sm transition-all active:scale-90"
                        onClick={() => openEdit(p)}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm border border-border-subtle/30 active:scale-90", p.isActive ? 'bg-bg-secondary text-text-muted/60 hover:text-error-main' : 'bg-success/10 text-success border-success/20')}
                        onClick={() => toggleActive(p.id)}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    <p className="text-[11px] text-text-muted/40 font-bold uppercase tracking-wider">Registry credentials and hub assignment.</p>
                 </div>
                 <button onClick={() => { setShowCreate(false); setEditingPerson(null); }} className="w-8 h-8 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-lg text-text-muted hover:text-text-main transition-colors">✕</button>
              </div>              <div className="space-y-5">
                 <TextField label="Full Legal Name" placeholder="e.g. Abebe Bikila" value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))} />
                 <TextField label="Operational Contact" placeholder="+251 ..." value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <SelectField 
                      label="Assigned Role" 
                      options={[{value:'STAFF',label:'Operations Staff'},{value:'DISTRICT_MANAGER',label:'Branch Overseer'}]} 
                      value={form.role} 
                      onChange={v => setForm(p => ({ ...p, role: v }))} 
                    />
                    <TextField label="Tier Index" type="number" step="0.1" value={form.commissionTier} onChange={v => setForm(p => ({ ...p, commissionTier: v }))} />
                 </div>
 
                 <SelectField 
                   label="Registry Hub" 
                   options={[{value:'',label:'Select branch hub...'}, ...branches.filter((b: any) => b.is_active).map((b: any) => ({value: b.id, label: b.name}))]} 
                   value={form.branchId} 
                   onChange={v => setForm(p => ({ ...p, branchId: v }))} 
                 />

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl text-[12px] font-bold border-border-subtle/30 shadow-sm" onClick={() => { setShowCreate(false); setEditingPerson(null); }}>Cancel</Button>
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
               <p className="text-[11px] font-bold text-text-muted font-medium opacity-30">Operational Personnel</p>
               <p className="text-lg font-bold text-text-main tracking-tight leading-none">{people.length || 0} <span className="text-[13px] text-primary-main font-bold ml-1 font-medium">Active</span></p>
            </div>
            <div className="w-px h-8 bg-border-subtle/30" />
            <div className="space-y-1">
               <p className="text-[11px] font-bold text-text-muted font-medium opacity-30">Network Coverage</p>
               <p className="text-lg font-bold text-text-main tracking-tight leading-none">{(branches.length || 0)} <span className="text-[13px] text-primary-main font-bold ml-1 font-medium">Hubs</span></p>
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
