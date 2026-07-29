'use client';

/**
 * SSR-safe inline script that reads the saved theme preference before paint.
 * Prevents flash of unstyled/wrong-theme content on initial page load.
 * Renders nothing visible.
 */

import { useServerInsertedHTML } from 'next/navigation';

export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('theme');if(!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
      }}
    />
  ));
  return null;
}
