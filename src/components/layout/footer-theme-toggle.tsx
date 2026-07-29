'use client';

/**
 * Theme toggle button for the footer. Switches between dark and light
 * mode using the ThemeProvider context.
 * Exports: FooterThemeToggle
 */

import { useTheme } from '@/components/theme-provider';

export function FooterThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="footer-theme-toggle"
      aria-label="Toggle theme"
    >
      <span className="leading-none">{theme === 'dark' ? '◑' : '◐'}</span>
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
