import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export const PwaInstallPrompt = () => {
  const { isInstallable, installApp } = usePwaInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isInstallable) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [isInstallable]);

  const handleInstallClick = async () => {
    await installApp();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 bg-surface-card border border-border-subtle rounded-2xl shadow-xl z-[9999] overflow-hidden"
        >
          <div className="p-4 flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-main/10 rounded-xl flex items-center justify-center shrink-0">
              <Download className="text-primary-main" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-text-main">Install PeaceCars</h3>
              <p className="text-[13px] text-text-muted mt-1 leading-snug">
                Install our app on your device for a faster, app-like experience with offline support!
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-primary-main text-white text-[13px] font-bold py-2.5 rounded-xl hover:bg-primary-hover transition-colors"
                >
                  Install Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-bg-secondary text-text-main text-[13px] font-bold py-2.5 rounded-xl hover:bg-border-subtle transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-text-muted hover:text-text-main shrink-0 p-1 rounded-lg hover:bg-bg-secondary"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
