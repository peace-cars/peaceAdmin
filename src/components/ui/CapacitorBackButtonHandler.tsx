import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export function CapacitorBackButtonHandler() {
  const [showExitModal, setShowExitModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let handler: any;

    const setupListener = async () => {
      handler = await App.addListener('backButton', ({ canGoBack }) => {
        // Paths considered root pages where pressing back prompts app exit
        const rootPaths = ['/', '/login', '/acquisitions', '/inspections', '/inbox', '/inventory', '/staff', '/branches', '/people', '/commissions', '/budgets', '/reports', '/finance', '/library', '/archive', '/notifications'];
        const currentPath = location.pathname.toLowerCase();
        
        // If we are at a root route, we ask the user if they want to exit
        const isRoot = rootPaths.includes(currentPath) || currentPath === '/' || currentPath === '';

        if (canGoBack && !isRoot) {
          // If we can go back and we are in a subpage, navigate back
          navigate(-1);
        } else {
          // Trigger confirmation dialog
          setShowExitModal(true);
        }
      });
    };

    setupListener();

    return () => {
      if (handler) {
        handler.remove();
      }
    };
  }, [location, navigate]);

  if (!showExitModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 transition-all duration-300">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-full text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-text-main">Exit Application</h3>
        </div>
        
        <p className="text-text-secondary mb-6 text-sm leading-relaxed">
          Are you sure you want to close Peace Cars? Any unsaved progress will be lost.
        </p>
        
        <div className="flex gap-3 justify-end">
          <button 
            type="button"
            onClick={() => setShowExitModal(false)}
            className="px-4 py-2.5 bg-surface-hover hover:bg-border-subtle text-text-main rounded-xl text-sm font-semibold transition active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => App.exitApp()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-600/25 transition active:scale-95 cursor-pointer"
          >
            Exit App
          </button>
        </div>
      </div>
    </div>
  );
}
