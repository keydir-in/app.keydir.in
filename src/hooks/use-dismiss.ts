'use client';

/**
 * Dismiss-on-outside-click + Escape hook for overlays (filter sidebar/drawer).
 * Optionally ignores clicks that originate from a trigger element so the
 * trigger's own toggle handler stays in control.
 */
import { useEffect, type RefObject } from 'react';

interface UseDismissOpts {
  ignoreSelector?: string;
}

export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss?: () => void,
  opts: UseDismissOpts = {},
) {
  useEffect(() => {
    if (!onDismiss) return;
    const dismiss = onDismiss;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        opts.ignoreSelector &&
        target instanceof HTMLElement &&
        target.closest(opts.ignoreSelector)
      ) {
        return;
      }
      if (ref.current && !ref.current.contains(target)) dismiss();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, onDismiss, opts.ignoreSelector]);
}
