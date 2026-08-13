'use client';

/**
 * Theme toggle button for the footer. Switches between dark and light
 * mode using the ThemeProvider context.
 * Exports: FooterThemeToggle
 */

import { useSyncExternalStore } from 'react';
import { useTheme } from '@/components/theme-provider';

// Server snapshot is `false` and the client snapshot is `true`, so SSR and the
// initial hydration render always agree (theme label shows the light variant).
// The real theme-dependent label only appears after mount — this avoids a
// hydration mismatch when this tree hydrates after the provider state has
// already switched (e.g. inside a Suspense boundary).
const subscribeNoop = () => () => {};

export function FooterThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const isDark = mounted && theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="footer-theme-toggle"
      aria-label="Toggle theme"
    >
      <span className="leading-none">{isDark ? '◑' : '◐'}</span>
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
