import React from 'react';
import { ClipboardCheck, CarFront, Zap, CheckCircle2, AlertCircle, Clock, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface StaffViewProps {
  tasks: any[];
  onStartInspection: (task: any) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ tasks, onStartInspection }) => {
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Tasks */}
        <div className="lg:col-span-2 space-y-3">
          <div className="px-1">
            <h2 className="text-[15px] font-semibold text-text-main">Active Tasks</h2>
            <p className="text-[13px] text-text-muted">Pending vehicle evaluations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingTasks.length === 0 ? (
              <div className="bg-surface-card rounded-2xl border border-border-subtle border-dashed col-span-full py-12 text-center flex flex-col items-center gap-3">
                <ClipboardCheck size={32} className="text-text-muted opacity-20" />
                <p className="text-[14px] text-text-muted">No active tasks</p>
                <p className="text-[13px] text-text-muted/40">Your queue is clear</p>
              </div>
            ) : pendingTasks.map(task => (
              <div 
                key={task.id} 
                className="bg-surface-card rounded-2xl border border-border-subtle overflow-hidden hover:border-primary-main/30 transition-all"
              >
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-bg-secondary flex items-center justify-center text-primary-main">
                      {task.trade_in_requests?.financing_requested ? <Zap size={22} /> : <CarFront size={22} />}
                    </div>
                    <Badge variant="primary">{task.priority || 'NORMAL'}</Badge>
                  </div>

                  <div>
                    <h4 className="text-[15px] font-semibold text-text-main">
                      {task.trade_in_requests?.vehicle_make_model || task.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-[13px] text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <User size={13} /> {task.trade_in_requests?.profiles?.full_name || 'Customer'}
                      </span>
                      <span className="text-text-muted/40">·</span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} /> {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => onStartInspection(task)}
                  >
                    Start Evaluation
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="text-[15px] font-semibold text-text-main">History</h2>
            <p className="text-[13px] text-text-muted">Recent evaluations</p>
          </div>
          
          <div className="bg-surface-card rounded-2xl border border-border-subtle overflow-hidden">
            {completedTasks.length === 0 ? (
              <div className="py-10 text-center">
                <AlertCircle size={20} className="mx-auto mb-2 text-text-muted opacity-30" />
                <p className="text-[13px] text-text-muted">No history yet</p>
              </div>
            ) : (
               <div className="divide-y divide-border-subtle/30">
                {completedTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3.5 hover:bg-bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-text-main">{task.trade_in_requests?.vehicle_make_model || 'Appraisal'}</p>
                        <p className="text-[12px] text-text-muted/60">{task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Recent'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-3 border-t border-border-subtle/30">
              <Button variant="secondary" className="w-full h-10 rounded-lg text-[13px] font-bold" size="sm">Full History</Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
