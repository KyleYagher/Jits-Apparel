import { useEffect, useState, ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';

type Theme = 'light' | 'dark' | 'system';

// Get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Calculate resolved theme based on current theme setting
const calculateResolvedTheme = (currentTheme: Theme): 'light' | 'dark' => {
  if (currentTheme === 'system') {
    return getSystemTheme();
  }
  return currentTheme;
};

// Initialize theme from localStorage
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('jits-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
  }
  return 'system';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Use lazy initializer to read from localStorage only once
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  
  // Initialize resolvedTheme based on the initial theme
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => 
    calculateResolvedTheme(getInitialTheme())
  );

  // Update theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('jits-theme', newTheme);
    setResolvedTheme(calculateResolvedTheme(newTheme));
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}