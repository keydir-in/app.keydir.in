'use client';

/**
 * Pagination component with page navigation, prev/next buttons, and
 * ellipsis-collapsed page numbers. Updates URL search params on page change.
 * Exports: Pagination
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  siblingCount?: number;
}

function generatePagination(current: number, total: number, siblingCount: number) {
  const delta = siblingCount;
  const range: (number | 'dots')[] = [];

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== 'dots') {
      range.push('dots');
    }
  }

  return range;
}

export function Pagination({ page, totalPages, siblingCount = 1 }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;
      const params = new URLSearchParams(searchParams.toString());
      if (targetPage === 1) {
        params.delete('page');
      } else {
        params.set('page', String(targetPage));
      }
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [pathname, searchParams, router, page, totalPages],
  );

  if (totalPages <= 1) return null;

  const pages = generatePagination(page, totalPages, siblingCount);

  return (
    <nav className="pagination" aria-label="Page navigation">
      <button
        type="button"
        className="pagination-btn pagination-prev"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      <div className="pagination-pages">
        {pages.map((item, i) =>
          item === 'dots' ? (
            <span key={`dots-${i}`} className="pagination-dots">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`pagination-btn pagination-page${item === page ? ' active' : ''}`}
              onClick={() => goToPage(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="pagination-btn pagination-next"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
