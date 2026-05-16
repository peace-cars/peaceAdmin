import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer,
  maxWidth = 'max-w-lg' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] isolate">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 pointer-events-auto"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex flex-col justify-end md:items-center md:justify-center pointer-events-none p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className={cn(
                "bg-surface-card w-full rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden pointer-events-auto flex flex-col max-h-[92vh] md:max-h-[85vh] relative",
                maxWidth
              )}
            >
              {/* Drag Handle (mobile) */}
              <div className="flex justify-center pt-2 pb-0 md:hidden">
                <div className="w-9 h-1 bg-border-strong rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 md:px-6 py-4 border-b border-border-subtle flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-[17px] font-semibold text-text-main">{title}</h2>
                  {subtitle && (
                    <p className="text-[13px] text-text-muted mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 shrink-0 flex items-center justify-center bg-surface-hover rounded-full text-text-muted hover:text-text-main hover:bg-border-subtle active:scale-95 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 md:px-6 py-5 overflow-y-auto no-scrollbar flex-grow">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-5 md:px-6 py-4 border-t border-border-subtle flex gap-3 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
