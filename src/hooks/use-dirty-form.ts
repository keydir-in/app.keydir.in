'use client';

/**
 * Client-side hook that tracks form dirty state by comparing current values
 * against initial values. Supports custom equality functions and reset/save.
 * @returns { isDirty, reset, markSaved, getInitialValues }
 */

import { useState, useRef, useCallback } from 'react';

export function useDirtyForm<T>(getInitial: () => T, equal?: (a: T, b: T) => boolean) {
  const [init, setInit] = useState(getInitial);
  const initRef = useRef(init);
  const eqRef = useRef(equal ?? ((a: T, b: T) => JSON.stringify(a) === JSON.stringify(b)));

  const isDirty = useCallback((current: T) => !eqRef.current(initRef.current, current), []);

  const reset = useCallback((current: T) => {
    initRef.current = current;
    setInit(current);
  }, []);

  const markSaved = useCallback(() => {
    const fresh = getInitial();
    initRef.current = fresh;
    setInit(fresh);
  }, [getInitial]);

  const getInitialValues = useCallback(() => initRef.current, []);

  return { isDirty, reset, markSaved, getInitialValues };
}
