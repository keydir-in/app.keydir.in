'use client';

import { useEffect } from 'react';

const OAuthParams = ['code', 'state', 'next'];

export function UrlCleanup() {
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;
    for (const param of OAuthParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }
    if (changed) {
      const clean = url.pathname + url.search + url.hash;
      window.history.replaceState(window.history.state, '', clean);
    }
  }, []);

  return null;
}
