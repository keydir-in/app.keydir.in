'use client';

/**
 * Number of columns the responsive product grids render at the current
 * viewport width. Mirrors the breakpoints in `lp-grid` / `catalog-grid`
 * CSS so row-based item counts stay in sync with the actual layout.
 */
import { useState, useEffect } from 'react';

const BREAKPOINTS: Array<[string, number]> = [
  ['(max-width: 480px)', 1],
  ['(max-width: 768px)', 2],
  ['(max-width: 1100px)', 3],
  ['(max-width: 1400px)', 4],
];

export function useGridColumns(): number {
  const [columns, setColumns] = useState(5);

  useEffect(() => {
    const mqls = BREAKPOINTS.map(([query]) => window.matchMedia(query));
    const compute = () => {
      for (let i = 0; i < mqls.length; i++) {
        if (mqls[i].matches) {
          setColumns(BREAKPOINTS[i][1]);
          return;
        }
      }
      setColumns(5);
    };
    compute();
    for (const mql of mqls) mql.addEventListener('change', compute);
    return () => {
      for (const mql of mqls) mql.removeEventListener('change', compute);
    };
  }, []);

  return columns;
}
