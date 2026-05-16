import React from 'react';
import { CarFront, User } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface LogViewerModalProps {
  log: any;
  isOpen: boolean;
  onClose: () => void;
  onViewReport: (lead: any) => void;
  locationName: string;
}

export const LogViewerModal: React.FC<LogViewerModalProps> = ({
  log,
  isOpen,
  onClose,
  onViewReport,
  locationName
}) => {
  if (!log) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dossier Verification"
      subtitle="Detailed system log and asset status"
      footer={
        <>
          <Button variant="outline" className="flex-1 h-12 rounded-xl text-[13px] font-bold" onClick={onClose}>Close</Button>
          <Button 
            variant="primary" 
            className="flex-1 h-12 rounded-xl text-[13px] font-bold"
            onClick={() => {
              onViewReport(log);
              onClose();
            }}
          >
            Technical Dossier
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-bg-secondary border border-border-subtle/30 rounded-2xl flex items-center justify-center text-text-muted shrink-0 shadow-inner group">
            <CarFront size={40} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-2xl font-bold text-text-main tracking-tight leading-tight">{log.car || log.vehicle}</h3>
            <div className="flex items-center gap-3">
              <p className="text-text-muted/60 text-[13px] font-medium">Registry ID</p>
              <Badge variant="default" className="font-mono bg-bg-secondary text-text-muted/80">{log.id.toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
          <div className="space-y-2">
            <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-wider">Acquisition Partner</p>
            <p className="text-sm font-bold text-text-main tracking-tight">{log.customer}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-wider">Lifecycle Status</p>
            <Badge variant="primary" className="px-3 py-1">
              {log.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-wider">Valuation Target</p>
            <p className="text-base font-bold text-text-main tracking-tight">
              {(log.price || log.user_asking_price_etb || log.askingPrice || 0).toLocaleString()} 
              <span className="text-[11px] text-primary-main ml-1 font-mono">ETB</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-bold text-text-muted/40 uppercase tracking-wider">Hub Assignment</p>
            <p className="text-sm font-bold text-text-main tracking-tight flex items-center gap-2">
              {locationName}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
