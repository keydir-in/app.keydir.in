'use client';

/**
 * Compare page content with spec rows and difference highlighting.
 * Renders a grid matrix of product specifications grouped into collapsible
 * sections, with support for filtering to show only differing rows.
 * Exports: CompareContent
 */

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { formatSpecValue, allSame } from './spec-defs';
import { CompareProductCards } from './compare-product-card';
import type { CompareProduct, SpecGroup } from './compare-types';

interface Props {
  products: CompareProduct[];
  onRemove: (slug: string) => void;
  onlyDiff: boolean;
  specGroups: SpecGroup[];
  title: string;
  noSpecsMessage: string;
}

export function CompareContent({ products, onRemove, onlyDiff, specGroups, title, noSpecsMessage }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['Switches', 'Keycaps']));

  const specs: (Record<string, unknown> | null)[] = products.map((p) => p.spec);
  const hasSpecs = specs.some((s) => s !== null);

  const visibleGroups = useMemo(() => {
    if (!onlyDiff) return specGroups;
    return specGroups.filter((group) => {
      const validSpecs = specs.filter((s): s is Record<string, unknown> => s !== null);
      if (validSpecs.length < 2) return true;
      return !group.rows.every((row) => allSame(validSpecs, row));
    });
  }, [onlyDiff, specs, specGroups]);

  function toggleGroup(groupTitle: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(groupTitle)) next.delete(groupTitle);
      else next.add(groupTitle);
      return next;
    });
  }

  const colCount = products.length + 1;
  const gridCols = `160px repeat(${products.length}, 1fr)`;

  return (
    <div className="cmp-content">
      <div className="cmp-scroll-wrap">
        <div className="cmp-matrix" style={{ gridTemplateColumns: gridCols }}>
          {/* Feature / Product header row */}
          <div className="cmp-header-row" style={{ gridColumn: '1 / -1' }}>
            <div className="cmp-matrix-row" style={{ gridTemplateColumns: gridCols }}>
              <div className="cmp-header-label">Feature</div>
              {products.map((p) => (
                <div key={p.id} className="cmp-header-product">{p.name}</div>
              ))}
            </div>
          </div>

          {/* Product cards row */}
          <div className="cmp-card-row" style={{ gridColumn: '1 / -1' }}>
            <div className="cmp-matrix-row" style={{ gridTemplateColumns: gridCols }}>
              <div className="cmp-label-cell">
                <span className="cmp-label-title">{title}</span>
              </div>
              <CompareProductCards products={products} onRemove={onRemove} />
            </div>
          </div>

          {!hasSpecs && (
            <div className="cmp-empty" style={{ gridColumn: `1 / span ${colCount}` }}>
              {noSpecsMessage}
            </div>
          )}

          {hasSpecs && visibleGroups.map((group) => {
            const validSpecs = specs.filter((s): s is Record<string, unknown> => s !== null);
            const isCollapsed = group.collapsible && collapsed.has(group.title);

            const visibleRows = group.rows.filter((row) => {
              if (!onlyDiff) return true;
              if (validSpecs.length < 2) return true;
              return !allSame(validSpecs, row);
            });

            if (onlyDiff && visibleRows.length === 0) return null;

            return (
              <div key={group.title} style={{ gridColumn: `1 / span ${colCount}`, display: 'contents' }}>
                <div
                  className={`cmp-section${group.collapsible ? ' collapsible' : ''}`}
                  style={{ gridColumn: `1 / span ${colCount}` }}
                  onClick={() => group.collapsible && toggleGroup(group.title)}
                >
                  <span className="cmp-section-title">{group.title}</span>
                  {group.collapsible && (
                    <span className="cmp-section-toggle">
                      {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </span>
                  )}
                </div>

                {!isCollapsed && visibleRows.map((row) => {
                  const isSame = validSpecs.length >= 2 && allSame(validSpecs, row);
                  const isDiff = validSpecs.length >= 2 && !isSame;

                  return (
                    <div key={row.key} className="cmp-row" style={{ gridColumn: `1 / span ${colCount}`, gridTemplateColumns: gridCols }}>
                      <div className="cmp-row-label">{row.label}</div>
                      {products.map((p) => {
                        const f = p.spec ? formatSpecValue(p.spec, row.key, row.type) : null;
                        if (!f) {
                          return <div key={p.id} className="cmp-cell"><span className="cmp-cell-empty">—</span></div>;
                        }
                        return (
                          <div key={p.id} className={`cmp-cell${isDiff ? ' diff' : ''}${f.isMulti ? ' multi-value' : ''}`}>
                            {f.isBool ? (
                              <span className={`cmp-boolean ${f.boolVal ? 'yes' : 'no'}`}>
                                {f.boolVal ? 'YES' : 'NO'}
                              </span>
                            ) : f.lines.length > 1 ? (
                              f.lines.map((line, li) => <span key={li}>{line}</span>)
                            ) : (
                              f.lines[0]
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
