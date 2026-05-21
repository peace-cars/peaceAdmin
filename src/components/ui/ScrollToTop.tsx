import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
    // Also scroll all scrollable containers to top
    document.querySelectorAll('[style*="overflow"]').forEach(el => {
      if (el instanceof HTMLElement) {
        el.scrollTop = 0;
      }
    });
  }, [pathname]);

  return null;
}
