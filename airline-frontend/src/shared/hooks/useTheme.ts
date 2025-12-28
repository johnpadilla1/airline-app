import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * UseTheme hook return type
 */
export interface UseThemeReturn {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * useTheme Hook
 * 
 * Custom hook for managing application theme (dark/light mode).
 * Persists preference to localStorage and syncs with system preference.
 * 
 * @returns UseThemeReturn object with theme state and actions
 * 
 * @example
 * ```tsx
 * const { isDarkMode, toggleTheme } = useTheme();
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Get initial theme from localStorage or system preference
  const getDefaultTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark';
    
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setThemeValue] = useLocalStorage<Theme>('theme', getDefaultTheme());

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setThemeValue(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setThemeValue]);

  const toggleTheme = useCallback(() => {
    setThemeValue((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setThemeValue]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeValue(newTheme);
  }, [setThemeValue]);

  return {
    theme,
    isDarkMode: theme === 'dark',
    toggleTheme,
    setTheme,
  };
}
