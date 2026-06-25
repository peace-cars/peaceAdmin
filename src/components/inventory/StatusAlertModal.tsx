import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface StatusAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export const StatusAlertModal: React.FC<StatusAlertModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
}) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center p-4">
        {/* Icon with glowing pulse */}
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mb-6 relative',
            isSuccess
              ? 'bg-success/15 text-success shadow-[0_0_35px_rgba(52,199,89,0.3)]'
              : 'bg-error/15 text-error shadow-[0_0_35px_rgba(255,59,48,0.3)]',
          )}
        >
          <div className="absolute inset-0 rounded-full border border-current opacity-20 scale-125 animate-ping" />
          {isSuccess ? <CheckCircle2 size={42} /> : <XCircle size={42} />}
        </div>

        {/* Text Details */}
        <h3 className="text-xl font-black text-text-main tracking-tight mb-2">{title}</h3>
        <p className="text-[14px] text-text-secondary leading-relaxed max-w-xs mb-8">{message}</p>

        {/* Action Button */}
        <Button
          variant={isSuccess ? 'primary' : 'outline'}
          className={cn(
            'w-full h-11 shadow-md font-bold uppercase tracking-wider text-[12px]',
            !isSuccess && 'border-error-main/30 text-error-main hover:bg-error-main/5',
          )}
          onClick={onClose}
        >
          Acknowledge
        </Button>
      </div>
    </Modal>
  );
};
