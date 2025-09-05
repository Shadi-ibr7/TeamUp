import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  muted: string;
  mutedForeground: string;
  success: string;
  warning: string;
  backgroundGradient: [string, string, ...string[]];
  glass: {
    light: string;
    dark: string;
    border: {
      light: string;
      dark: string;
    };
  };
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themePreference: 'light' | 'dark' | 'system';
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  primary: '#007AFF',
  primaryForeground: '#FFFFFF',
  secondary: '#5856D6',
  secondaryForeground: '#FFFFFF',
  background: '#F2F2F7',
  foreground: '#000000',
  card: 'rgba(255,255,255,0.7)',
  cardForeground: '#000000',
  destructive: '#FF3B30',
  destructiveForeground: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  input: 'rgba(118,118,128,0.12)',
  muted: '#8E8E93',
  mutedForeground: '#636366',
  success: '#34C759',
  warning: '#FF9500',
  backgroundGradient: ['#ffffff', '#f0f9ff', '#e0f2fe'],
  glass: {
    light: 'rgba(255,255,255,0.6)',
    dark: 'rgba(248,248,248,0.8)',
    border: {
      light: 'rgba(255,255,255,0.3)',
      dark: 'rgba(0,0,0,0.1)',
    },
  },
};

const darkColors: ThemeColors = {
  primary: '#0A84FF',
  primaryForeground: '#FFFFFF',
  secondary: '#0f172a',
  secondaryForeground: '#FFFFFF',
  background: '#0f172a',
  foreground: '#FFFFFF',
  card: 'rgba(30,41,59,0.8)',
  cardForeground: '#FFFFFF',
  destructive: '#FF453A',
  destructiveForeground: '#FFFFFF',
  border: 'rgba(255,255,255,0.2)',
  input: 'rgba(255,255,255,0.1)',
  muted: '#64748b',
  mutedForeground: '#94a3b8',
  success: '#32D74B',
  warning: '#FF9F0A',
  backgroundGradient: ['#0f172a', '#1e293b', '#334155'],
  glass: {
    light: 'rgba(28,28,30,0.6)',
    dark: 'rgba(18,18,20,0.8)',
    border: {
      light: 'rgba(255,255,255,0.1)',
      dark: 'rgba(255,255,255,0.05)',
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    // Charger la préférence sauvegardée
    loadThemePreference();

    // Écouter les changements du thème système
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('themePreference');
      if (saved) {
        setThemePreference(saved as 'light' | 'dark' | 'system');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    }
  };

  const saveThemePreference = async (preference: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem('themePreference', preference);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  const isDarkMode = themePreference === 'system' 
    ? systemTheme === 'dark'
    : themePreference === 'dark';

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setThemePreference(newTheme);
    saveThemePreference(newTheme);
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    saveThemePreference(theme);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme, themePreference, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};