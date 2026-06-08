import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache } from '../lib/cache';
import { Building2, CheckCircle, XCircle, Search, Clock, FileText } from 'lucide-react';

export default function FinanceManager() {
  const { session } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPlans();
  }, [session]);

  const fetchPlans = () => {
    if (!session?.access_token) return;
    fetchWithCache('/finance-plans', {}, (data) => {
      setPlans(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  };

  const updateStatus = async (planId: string, status: string) => {
    if (!session?.access_token) return;
    try {
      await api.patch(`/finance-plans/${planId}/status`, { status });
      fetchPlans(); // Refresh
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const filteredPlans = plans.filter(p => 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.vehicles?.make?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Finance Applications</h1>
          <p className="text-sm text-text-secondary">Review and manage vehicle financing requests from Bank Partners.</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main w-full md:w-64 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary-main/20  rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.length === 0 ? (
            <div className="text-center p-12 bg-surface rounded-xl border border-divider">
              <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No finance applications found.</p>
            </div>
          ) : (
            filteredPlans.map(plan => (
              <div key={plan.id} className="bg-surface rounded-xl border border-divider p-5 flex flex-col md:flex-row gap-6  transition-all">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-main/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-main" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">{plan.profiles?.full_name}</h3>
                        <p className="text-xs text-text-secondary">{plan.profiles?.phone}</p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      plan.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      plan.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-orange-500/10 text-orange-500 border-orange-500/20'
                    }`}>
                      {plan.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-bg-base rounded-lg border border-divider/50">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Vehicle</p>
                      <p className="text-sm font-semibold text-text-primary">{plan.vehicles?.make} {plan.vehicles?.model}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Bank</p>
                      <p className="text-sm font-semibold text-text-primary">{plan.bank_partners?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Loan Amount</p>
                      <p className="text-sm font-semibold text-primary-main">{(plan.total_price_etb / 1000000).toFixed(2)}M ETB</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Monthly</p>
                      <p className="text-sm font-semibold text-text-primary">{(plan.monthly_installment_etb / 1000).toFixed(1)}K ETB</p>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-divider pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                  {plan.status === 'SUBMITTED' ? (
                    <>
                      <button 
                        onClick={() => updateStatus(plan.id, 'APPROVED')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button 
                        onClick={() => updateStatus(plan.id, 'REJECTED')}
                        className="flex-1 flex items-center justify-center gap-2 bg-surface border border-red-500/50 text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/10 transition"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted text-sm gap-2">
                      <Clock className="w-5 h-5" />
                      <span>Processed</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
