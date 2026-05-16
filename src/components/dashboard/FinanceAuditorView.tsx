import React from 'react';
import { Calculator, Building2, User } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface FinanceAuditorViewProps {
  budgets: any[];
  onDisburse: (id: string, amount: number) => void;
}

export const FinanceAuditorView: React.FC<FinanceAuditorViewProps> = ({
  budgets,
  onDisburse
}) => {
  const pendingDisbursements = budgets.filter(b => b.status === 'APPROVED');

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionCard title="Pending Disbursements" subtitle="Authorized resource allocation">
        <div className="divide-y divide-border-subtle/30">
          {pendingDisbursements.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <Calculator size={32} className="text-text-muted opacity-20" />
              <p className="text-[14px] text-text-muted">No disbursements pending</p>
            </div>
          ) : pendingDisbursements.map(b => (
            <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-secondary/50 transition-colors">
              <div className="flex items-center gap-4 flex-grow">
                <div className="w-11 h-11 bg-success/10 border border-success/20 rounded-xl flex items-center justify-center text-success shrink-0">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-text-main">{b.purpose}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
                      <Building2 size={13} /> {b.profiles?.locations?.name || 'Central'}
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
                      <User size={13} /> {b.profiles?.full_name || 'Staff'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="md:text-right">
                  <p className="text-[12px] text-text-muted">Amount</p>
                  <p className="text-[16px] font-bold text-text-main">
                    {(b.amount_approved || b.amount_requested).toLocaleString()} <span className="text-[12px] text-primary-main">ETB</span>
                  </p>
                </div>
                <Button 
                  variant="primary"
                  className="bg-success text-bg hover:bg-success/90 shrink-0 h-10 px-4 text-[13px] font-bold"
                  onClick={() => onDisburse(b.id, b.amount_approved || b.amount_requested)}
                >
                  Release Funds
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
