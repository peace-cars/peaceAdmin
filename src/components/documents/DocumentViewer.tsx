import React, { useEffect } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { Button } from '../ui/Button';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DocumentViewer({ isOpen, onClose, title, children }: DocumentViewerProps) {
  useEffect(() => {
    // Add a class to body to hide standard layout elements if needed
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/90 print:bg-white">
      
      {/* Action Bar - Hidden when printing */}
      <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-xl">
        <div className="flex items-center gap-4 text-white">
          <div className="w-8 h-8 rounded-lg bg-primary-main/20 flex items-center justify-center border border-primary-main/30">
            <Printer size={16} className="text-primary-main" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">{title}</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Print Preview</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            <Printer size={14} className="mr-2" /> Print Document
          </Button>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Document Canvas */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center print:p-0 print:overflow-visible">
        <div className="bg-white shadow-2xl rounded-sm print:shadow-none print:rounded-none w-full max-w-[210mm] min-h-[297mm] mx-auto print-container">
          {children}
        </div>
      </div>
    </div>
  );
}
