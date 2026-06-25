import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type CardAccent = 'none' | 'solid-blue' | 'solid-green' | 'solid-amber' | 'solid-rose' | 'solid-purple' | 'light-blue' | 'light-green' | 'light-amber' | 'light-rose' | 'light-purple';
export type BgGradient = 'default' | 'light-blue' | 'light-emerald' | 'light-purple' | 'light-coral' | 'solid-white' | 'solid-slate' | 'solid-blue';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  cardAccent: CardAccent;
  setCardAccent: (accent: CardAccent) => void;
  bgGradient: BgGradient;
  setBgGradient: (grad: BgGradient) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const [cardAccent, setCardAccentState] = useState<CardAccent>(() => {
    const saved = localStorage.getItem('card_accent');
    return (saved as CardAccent) || 'none';
  });

  const [bgGradient, setBgGradientState] = useState<BgGradient>(() => {
    const saved = localStorage.getItem('bg_gradient');
    return (saved as BgGradient) || 'default';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    root.classList.add('theme-transitioning');
    
    const change = () => {
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    if ((document as any).startViewTransition) {
      (document as any).startViewTransition(change);
    } else {
      change();
    }

    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 450);
  };

  const setCardAccent = (accent: CardAccent) => {
    setCardAccentState(accent);
    localStorage.setItem('card_accent', accent);
  };

  const setBgGradient = (grad: BgGradient) => {
    setBgGradientState(grad);
    localStorage.setItem('bg_gradient', grad);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      cardAccent,
      setCardAccent,
      bgGradient,
      setBgGradient
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

