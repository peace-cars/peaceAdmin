import React, { useState, useEffect } from 'react';
import { Users, Circle, Phone, Star, ClipboardCheck, Clock, Search, Plus, X, ShieldCheck, Briefcase, Activity, CheckCircle2, Edit3, Trash2, Calendar, User, Camera } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiTile } from '../components/ui/KpiTile';
import { Button } from '../components/ui/Button';
import { TextField, SelectField } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

export default function BranchRoster() {
  const { session } = useAuth();
  const [roster, setRoster] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isHiring, setIsHiring] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [viewingStaff, setViewingStaff] = useState<any>(null);
  const [staffTasks, setStaffTasks] = useState<any[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    role: 'STAFF',
    locationId: '',
    commissionTier: 1.0,
    date_of_birth: ''
  });

  const fetchRoster = async () => {
    if (!session) return;
    try {
      const data = await api.get<any[]>('/staff-performance/branch-roster');
      const dataArray = Array.isArray(data) ? data : [];
      const mapped = dataArray.map((s: any) => ({
        id: s.id,
        fullName: s.full_name || 'Unassigned Staff',
        role: s.role,
        isOnline: s.isOnline || false,
        phone: s.phone_number || 'No Phone',
        activeInspections: s.activeTasks || 0,
        totalDealsClosed: s.total_completed_tasks || 0,
        averageRating: s.performance_rating || 5.0,
        shiftStartedAt: s.shiftStartedAt || null,
        dateOfBirth: s.date_of_birth || null,
        locationId: s.location_id
      }));
      setRoster(mapped); 
      setLoading(false); 
    } catch (err) {
      console.error(err);
      setRoster([]);
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    if (!session) return;
    try {
      const data = await api.get<any[]>('/locations');
      setLocations(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoster();
    fetchLocations();
  }, [session]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (staffId: string): Promise<string | null> => {
    if (!avatarFile || !session) return null;
    try {
      const fd = new FormData();
      fd.append('file', avatarFile);
      fd.append('bucket', 'vehicles');
      fd.append('folder', `staff-avatars/${staffId}`);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/storage/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: fd
      });
      if (!res.ok) return null;
      const { url } = await res.json();
      return url;
    } catch { return null; }
  };

  const fetchStaffTasks = async (staffId: string) => {
    try {
      const data = await api.get<any[]>(`/staff-tasks?staffId=${staffId}`);
      setStaffTasks(Array.isArray(data) ? data : []);
    } catch { setStaffTasks([]); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      if (isEditing && selectedStaff) {
        const avatarUrl = await uploadAvatar(selectedStaff.id);
        const payload = avatarUrl ? { ...formData, avatar_url: avatarUrl } : formData;
        await api.patch(`/people/${selectedStaff.id}`, payload);
        alert('Personnel record updated.');
      } else {
        const result = await api.post<any>('/people', formData);
        if (result?.id && avatarFile) {
          const avatarUrl = await uploadAvatar(result.id);
          if (avatarUrl) await api.patch(`/people/${result.id}`, { avatar_url: avatarUrl });
        }
        alert('Personnel onboarded successfully.');
      }
      setIsHiring(false);
      setIsEditing(false);
      setSelectedStaff(null);
      setAvatarFile(null);
      setAvatarPreview('');
      setFormData({ fullName: '', phone: '', role: 'STAFF', locationId: '', commissionTier: 1.0, date_of_birth: '' });
      fetchRoster();
    } catch (err) {
      console.error(err);
      alert('Operation failed. Ensure all registry fields are valid.');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this personnel record? They will lose access to the operational registry.')) return;
    try {
      await api.delete(`/people/${id}`);
      fetchRoster();
    } catch (e) {
      console.error(e);
    }
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A';
    const birth = new Date(dob);
    const age = new Date().getFullYear() - birth.getFullYear();
    return age;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] text-primary-main font-bold text-[12px] font-medium animate-pulse">
      Synchronizing Registry...
    </div>
  );

  const filtered = (Array.isArray(roster) ? roster : []).filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = (Array.isArray(roster) ? roster : []).filter(s => s.isOnline).length;

  return (
    <div className="space-y-8 pb-16">
      <PageHeader 
        title="Personnel Roster" 
        subtitle="Operational oversight of regional personnel."
        icon={<Users size={18} className="text-primary-main" />}
        actions={
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter personnel..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-bg-secondary border border-border-subtle rounded-xl py-2.5 pl-11 pr-6 text-[13px] font-medium text-text-main focus:outline-none focus:border-primary-main/30 transition-all w-64 shadow-sm" 
                />
             </div>
             <Button 
               variant="primary" 
               size="sm"                onClick={() => {
                 setIsEditing(false);
                 setFormData({ fullName: '', phone: '', role: 'STAFF', locationId: '', commissionTier: 1.0, date_of_birth: '' });
                 setIsHiring(true);
               }} 
               className="rounded-xl h-11 px-6 bg-text-main text-bg font-bold text-[12px] shadow-xl active:scale-95 transition-all"
             >
                Onboard Personnel
             </Button>
          </div>
        }
        className="pb-6 border-b border-border-subtle/30"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Active Team" value={roster.length} icon={<Users size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Operational" value={onlineCount} icon={<Activity size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Open Tasks" value={roster.reduce((s, m) => s + m.activeInspections, 0)} icon={<ClipboardCheck size={14} />} className="rounded-xl p-4 h-28" />
        <KpiTile label="Registry Link" value="Stable" icon={<CheckCircle2 size={14} />} className="rounded-xl p-4 h-28" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((member) => (
          <div
            key={member.id}
            onClick={() => { setViewingStaff(member); fetchStaffTasks(member.id); }}
            className={cn(
              "bg-surface-card rounded-2xl shadow-sm border border-border-subtle hover:shadow-md p-5 md:p-6 flex flex-col group transition-all relative overflow-hidden cursor-pointer hover:border-primary-main/30 hover:-translate-y-1",
              !member.isOnline && "opacity-70 bg-bg-secondary/20 border-dashed"
            )}
          >
            {/* Swipe-to-action hint gradient for mobile */}
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-indigo-50 to-transparent opacity-0 group-active:opacity-100 transition-opacity pointer-events-none md:hidden" />

            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-sm font-bold shadow-inner border transition-all overflow-hidden",
                    member.isOnline ? 'bg-primary-main/10 text-primary-main border-primary-main/10' : 'bg-surface-card text-text-muted/30 border-border-subtle'
                  )}>
                    {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : member.fullName.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                   {member.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-bg rounded-full shadow-sm" />}
                </div>
                <div className="space-y-1 md:space-y-0.5">
                  <h3 className="text-base md:text-sm font-bold text-text-main tracking-tight group-hover:text-primary-main transition-colors">{member.fullName}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-primary-main text-[13px] md:text-[12px] font-medium">{member.role?.replace(/_/g, ' ')}</p>
                    <span className="w-1 h-1 bg-border-subtle rounded-full" />
                    <p className="text-text-muted text-[13px] md:text-[12px] font-medium">Age: {calculateAge(member.dateOfBirth)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5 md:mb-4">
              <div className="bg-bg-secondary/30 rounded-xl p-3 md:p-2.5 text-center border border-border-subtle/50"><p className="text-[12px] md:text-[11px] text-text-muted uppercase font-bold tracking-widest mb-1">Active</p><p className="text-lg md:text-base font-bold text-text-main">{member.activeInspections}</p></div>
              <div className="bg-bg-secondary/30 rounded-xl p-3 md:p-2.5 text-center border border-border-subtle/50"><p className="text-[12px] md:text-[11px] text-text-muted uppercase font-bold tracking-widest mb-1">Done</p><p className="text-lg md:text-base font-bold text-text-main">{member.totalDealsClosed}</p></div>
              <div className="bg-bg-secondary/30 rounded-xl p-3 md:p-2.5 text-center border border-border-subtle/50"><p className="text-[12px] md:text-[11px] text-text-muted uppercase font-bold tracking-widest mb-1">Rating</p><p className="text-lg md:text-base font-bold text-primary-main">{member.averageRating}</p></div>
            </div>

             <div className="flex items-center justify-between pt-4 md:pt-3 border-t border-border-subtle/30 mt-auto">
              <div className="flex items-center gap-2 md:gap-1.5" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setSelectedStaff(member); setFormData({ fullName: member.fullName, phone: member.phone, role: member.role, locationId: member.locationId, commissionTier: 1.0, date_of_birth: member.dateOfBirth || '' }); setIsEditing(true); setIsHiring(true); }} className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-xl md:rounded-lg bg-bg-secondary border border-border-subtle text-text-muted hover:text-primary-main hover:bg-bg transition-all shadow-sm md:shadow-none"><Edit3 size={14} className="md:w-[13px]" /></button>
                <button onClick={() => handleDeactivate(member.id)} className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-xl md:rounded-lg bg-error-main/10 md:bg-bg-secondary border border-error-main/20 md:border-border-subtle text-error-main md:text-text-muted md:hover:text-error-main hover:bg-bg transition-all shadow-sm md:shadow-none"><Trash2 size={14} className="md:w-[13px]" /></button>
              </div>
              <a href={`tel:${member.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[11px] md:text-[13px] font-bold text-text-main md:text-text-muted hover:text-primary-main transition-colors font-medium bg-bg-secondary md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg"><Phone size={12} className="md:w-[11px]" /> {member.phone}</a>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isHiring} 
        onClose={() => setIsHiring(false)}
        title={isEditing ? "Modify Personnel Record" : "Personnel Onboarding"}
        subtitle="Operational entry into regional administrative registry."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-8">
           <div className="flex items-center gap-6 p-6 bg-bg-secondary rounded-2xl border border-border-subtle border-dashed">
              <label className="w-20 h-20 rounded-full bg-surface-card border-2 border-primary-main/10 flex items-center justify-center text-text-muted relative group cursor-pointer hover:border-primary-main transition-all overflow-hidden">
                 {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Camera size={24} className="opacity-40 group-hover:scale-110 transition-all" />}
                 <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} />
              </label>
              <div className="space-y-1">
                 <p className="text-sm font-bold text-text-main tracking-tight">{avatarPreview ? 'Photo Selected' : 'Upload Profile Photo'}</p>
                 <p className="text-[13px] text-text-muted font-medium">Click the circle to browse or take photo</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Full Legal Name" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} placeholder="e.g. Samuel Kebede" />
              <TextField label="Phone Identification" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="09..." />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField 
                label="Date of Birth" 
                type="date" 
                value={formData.date_of_birth} 
                onChange={v => setFormData({...formData, date_of_birth: v})} 
              />
              <SelectField 
                label="Assigned Branch Hub" 
                options={[{value:'',label:'Select branch...'}, ...locations.map(loc => ({value: loc.id, label: loc.name}))]} 
                value={formData.locationId} 
                onChange={v => setFormData({...formData, locationId: v})} 
              />
           </div>

           <div className="grid grid-cols-2 gap-6">
              <SelectField 
                label="Operational Role" 
                options={[{value:'STAFF',label:'Operations Staff'},{value:'DISTRICT_MANAGER',label:'District Manager'},{value:'FINANCE_AUDITOR',label:'Finance Auditor'}]} 
                value={formData.role} 
                onChange={v => setFormData({...formData, role: v})} 
              />
              <SelectField 
                label="Commission Tier" 
                options={[{value:'0.5',label:'Tier 0.5%'},{value:'1.0',label:'Tier 1.0%'},{value:'1.5',label:'Tier 1.5%'}]} 
                value={formData.commissionTier.toString()} 
                onChange={v => setFormData({...formData, commissionTier: parseFloat(v)})} 
              />
           </div>

           <div className="flex gap-4 pt-6 border-t border-border-subtle">
              <Button variant="outline" className="flex-1 h-16 rounded-2xl text-[11px] font-medium border-border-subtle" onClick={() => setIsHiring(false)}>Cancel</Button>
              <Button type="submit" variant="primary" className="flex-1 h-16 rounded-2xl text-[11px] font-medium shadow-2xl shadow-primary-main/20">
                 {isEditing ? 'Update Registry' : 'Confirm Onboarding'} <CheckCircle2 size={18} className="ml-3" />
              </Button>
           </div>
        </form>
      </Modal>

       {filtered.length === 0 && (
        <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle border-dashed text-center py-32 flex flex-col items-center justify-center gap-6">
          <Users size={64} className="opacity-5" />
          <p className="text-text-muted font-medium text-[11px] opacity-40 italic">No personnel records detected in the active registry.</p>
        </div>
      )}

      {/* Staff Detail Modal */}
      <Modal
        isOpen={!!viewingStaff}
        onClose={() => setViewingStaff(null)}
        title={viewingStaff?.fullName || 'Staff Profile'}
        subtitle={viewingStaff?.role?.replace(/_/g, ' ')}
        maxWidth="max-w-2xl"
      >
        {viewingStaff && (
          <div className="space-y-6">
            <div className="flex items-center gap-5 p-5 bg-bg-secondary rounded-2xl border border-border-subtle">
              <div className="w-16 h-16 rounded-2xl bg-surface-card border border-border-subtle flex items-center justify-center overflow-hidden shadow-inner text-lg font-bold text-primary-main">
                {viewingStaff.avatar ? <img src={viewingStaff.avatar} className="w-full h-full object-cover" /> : viewingStaff.fullName.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-text-main tracking-tight">{viewingStaff.fullName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="primary" className="text-[11px]">{viewingStaff.role?.replace(/_/g, ' ')}</Badge>
                  {viewingStaff.isOnline ? <Badge variant="success" className="text-[11px]">Online</Badge> : <Badge variant="default" className="text-[11px]">Offline</Badge>}
                </div>
              </div>
            </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-surface-card border border-border-subtle rounded-xl p-3 text-center"><p className="text-[11px] text-text-muted uppercase font-bold tracking-widest mb-1">Age</p><p className="text-xl font-bold text-text-main">{calculateAge(viewingStaff.dateOfBirth)}</p></div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-3 text-center"><p className="text-[11px] text-text-muted uppercase font-bold tracking-widest mb-1">Active</p><p className="text-xl font-bold text-text-main">{viewingStaff.activeInspections}</p></div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-3 text-center"><p className="text-[11px] text-text-muted uppercase font-bold tracking-widest mb-1">Completed</p><p className="text-xl font-bold text-text-main">{viewingStaff.totalDealsClosed}</p></div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-3 text-center"><p className="text-[11px] text-text-muted uppercase font-bold tracking-widest mb-1">Rating</p><p className="text-xl font-bold text-primary-main">{viewingStaff.averageRating}</p></div>
            </div>

             <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-bg-secondary/50 rounded-xl"><Phone size={14} className="text-primary-main" /><div><p className="text-[11px] text-text-muted uppercase font-bold tracking-widest">Phone</p><p className="text-xs font-bold text-text-main">{viewingStaff.phone}</p></div></div>
              <div className="flex items-center gap-3 p-3 bg-bg-secondary/50 rounded-xl"><Calendar size={14} className="text-primary-main" /><div><p className="text-[11px] text-text-muted uppercase font-bold tracking-widest">DOB</p><p className="text-xs font-bold text-text-main">{viewingStaff.dateOfBirth ? new Date(viewingStaff.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div></div>
            </div>

            {/* Task History */}
            <div className="space-y-3">
              <h4 className="text-[13px] font-bold text-text-main font-medium">Task History</h4>
              {staffTasks.length === 0 ? (
                <p className="text-[13px] text-text-muted italic py-4 text-center">No task history available</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                   {staffTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-surface-card border border-border-subtle rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", t.status === 'COMPLETED' ? 'bg-success' : t.status === 'IN_PROGRESS' ? 'bg-warning' : 'bg-primary-main')} />
                        <div>
                          <p className="text-[13px] font-bold text-text-main">{t.description || 'Task'}</p>
                          <p className="text-[11px] text-text-muted">{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</p>
                        </div>
                      </div>
                      <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'default'} className="text-[7px]">{t.status?.replace(/_/g, ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border-subtle flex justify-end">
              <Button variant="outline" onClick={() => setViewingStaff(null)}>Close Profile</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
