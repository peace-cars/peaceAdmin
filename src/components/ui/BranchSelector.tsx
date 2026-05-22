import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { clsx } from 'clsx';

export const BranchSelector = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const currentBranchId = localStorage.getItem('admin_selected_branch') || 'all';

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await api.get<any[]>('/locations');
        if (Array.isArray(data)) {
          setBranches(data);
        }
      } catch (err) {
        console.error('Failed to fetch branches', err);
      }
    };
    fetchBranches();
  }, []);

  const handleSelect = (id: string) => {
    localStorage.setItem('admin_selected_branch', id);
    setIsOpen(false);
    window.location.reload();
  };

  const currentBranch = branches.find(b => b.id === currentBranchId);
  const label = currentBranchId === 'all' ? 'All Branches' : (currentBranch?.name || 'Loading...');

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 rounded-xl bg-bg-secondary/30 border border-border-subtle/20 text-text-muted hover:text-text-main hover:bg-bg-secondary/50 transition-all text-[11px] font-bold uppercase tracking-wider"
      >
        <Building2 size={14} />
        <span className="max-w-[100px] truncate">{label}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[190]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface-card/95 backdrop-blur-xl border border-border-subtle/30 rounded-2xl shadow-2xl overflow-hidden z-[200] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2">
              <button
                onClick={() => handleSelect('all')}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold transition-all text-left",
                  currentBranchId === 'all' 
                    ? "bg-primary-main/10 text-primary-main" 
                    : "text-text-muted hover:bg-bg-secondary hover:text-text-main"
                )}
              >
                <span>All Branches</span>
                {currentBranchId === 'all' && <Check size={14} />}
              </button>
              
              <div className="h-px bg-border-subtle/30 my-1 mx-2" />
              
              <div className="max-h-60 overflow-y-auto no-scrollbar">
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => handleSelect(branch.id)}
                    className={clsx(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold transition-all text-left",
                      currentBranchId === branch.id 
                        ? "bg-primary-main/10 text-primary-main" 
                        : "text-text-muted hover:bg-bg-secondary hover:text-text-main"
                    )}
                  >
                    <span className="truncate pr-2">{branch.name}</span>
                    {currentBranchId === branch.id && <Check size={14} className="shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
