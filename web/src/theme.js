import { createContext, useContext } from 'react';

export const ThemeContext = createContext('dark');

export function useTheme() {
  return useContext(ThemeContext);
}

export const THEME_COLORS = {
  dark: {
    border: '#2a2f3d',
    surface: '#1a1d27',
    textPrimary: '#f1f5f9',
    textSecondary: '#e2e8f0',
    textMuted: '#94a3b8',
    accent: '#fb923c',
    success: '#22c55e',
    danger: '#ef4444',
    warn: '#f59e0b',
    colors: ['#fb923c', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a78bfa'],
  },
  light: {
    border: '#ddd0c4',
    surface: '#ffffff',
    textPrimary: '#1c1917',
    textSecondary: '#44403c',
    textMuted: '#78716c',
    accent: '#ea580c',
    success: '#16a34a',
    danger: '#dc2626',
    warn: '#d97706',
    colors: ['#ea580c', '#16a34a', '#d97706', '#db2777', '#0891b2', '#7c3aed'],
  },
};
