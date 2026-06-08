import { useState, useEffect } from 'react';

let deferredPrompt: any = null;
const listeners = new Set<() => void>();

const notifyListeners = () => listeners.forEach(fn => fn());

// Only attach the listener once globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners();
  });
  
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export const usePwaInstall = () => {
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);

  useEffect(() => {
    const handleUpdate = () => {
      setIsInstallable(!!deferredPrompt);
    };
    
    listeners.add(handleUpdate);
    handleUpdate(); // Check immediately
    
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        deferredPrompt = null;
        notifyListeners();
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (err) {
      console.error("Failed to install PWA", err);
    }
  };

  return { isInstallable, installApp };
};
