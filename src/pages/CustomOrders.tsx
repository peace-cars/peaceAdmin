import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { AdminSourcingView } from '../components/dashboard/AdminSourcingView';
import { fetchWithCache, apiCache } from '../lib/cache';

export default function CustomOrders() {
  const { session } = useAuth();
  const role = localStorage.getItem('admin_role') || 'DISTRICT_MANAGER';
  
  const [sourcingRequests, setSourcingRequests] = useState<any[]>([]);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [dmBranches, setDmBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    setLoading(true);

    let completedRequests = 0;
    const totalRequests = (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER') ? 3 : 1;

    const checkComplete = () => {
      completedRequests++;
      if (completedRequests >= totalRequests) {
        setLoading(false);
      }
    };

    fetchWithCache(`/sourcing-requests`, {}, (data) => {
      setSourcingRequests(Array.isArray(data) ? data : []);
    }).catch(console.error).finally(checkComplete);

    // DMs and GMs need staff list for assignment
    if (role === 'DISTRICT_MANAGER' || role === 'GENERAL_MANAGER') {
      fetchWithCache(`/people`, {}, (data) => {
        setBranchStaff(Array.isArray(data) ? data.filter((s: any) => s.isActive) : []);
      }).catch(console.error).finally(checkComplete);

      // GMs and DMs need branch list
      fetchWithCache('/locations', {}, (data) => {
        setDmBranches(Array.isArray(data) ? data : []);
      }).catch(console.error).finally(checkComplete);
    }
  }, [session, role]);


  const handleAssignSourcingRequest = async (reqId: string, staffId: string) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/sourcing-requests/${reqId}/assign`, { staffId });
      apiCache.clear();
      setSourcingRequests(sourcingRequests.map(r => 
        r.id === reqId 
          ? { ...r, assigned_staff: branchStaff.find(s => s.id === staffId) || { id: staffId, full_name: 'Assigned Staff' }, status: 'SEARCHING' } 
          : r
      ));
    } catch (e) {
      console.error(e);
      alert('Failed to assign sourcing request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSourcingRequestBranch = async (reqId: string, branchId: string) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/sourcing-requests/${reqId}/assign`, { branchId });
      apiCache.clear();
      setSourcingRequests(sourcingRequests.map(r => 
        r.id === reqId 
          ? { ...r, branch: dmBranches.find(b => b.id === branchId) || { id: branchId, name: 'Assigned Branch' } } 
          : r
      ));
    } catch (e) {
      console.error(e);
      alert('Failed to assign sourcing request to branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="pb-6 border-b border-border-subtle/30 flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-main/10 border border-primary-main/20 flex items-center justify-center">
                <Building2 size={20} className="text-primary-main" />
              </div>
              <h1 className="text-2xl font-bold text-text-main tracking-tight">Custom Sourcing Hub</h1>
            </div>
         </div>
         
         {role === 'GENERAL_MANAGER' && localStorage.getItem('admin_selected_branch_name') && localStorage.getItem('admin_selected_branch_name') !== 'ALL BRANCHES' && (
           <div className="flex items-center gap-2">
             <span className="text-[13px] font-medium text-text-muted">Viewing:</span>
             <span className="bg-surface-card border border-border-subtle text-[13px] md:text-[14px] font-semibold h-10 px-4 flex items-center rounded-xl text-text-main shadow-sm">
               {localStorage.getItem('admin_selected_branch_name')}
             </span>
           </div>
         )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary-main/20  rounded-full animate-spin" />
          <p className="text-text-muted text-[13px] font-bold uppercase tracking-widest">Syncing Sourcing Hub...</p>
        </div>
      ) : (
        <AdminSourcingView 
          requests={sourcingRequests}
          staffList={branchStaff}
          branches={dmBranches}
          onAssignStaff={handleAssignSourcingRequest}
          onAssignBranch={handleAssignSourcingRequestBranch}
          currentUserRole={role}
        />
      )}
    </div>
  );
}
