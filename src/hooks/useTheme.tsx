import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, forcedTheme }: { children: ReactNode; forcedTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (forcedTheme) return forcedTheme;
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'dark';
  });

  useEffect(() => {
    if (forcedTheme) {
      setThemeState(forcedTheme);
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(forcedTheme);
      return;
    }

    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, forcedTheme]);

  const setTheme = (newTheme: Theme) => {
    if (!forcedTheme) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    if (!forcedTheme) {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      console.log('Toggling theme from', theme, 'to', newTheme);
      setTheme(newTheme);
    } else {
      console.log('Theme toggle blocked by forcedTheme:', forcedTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
