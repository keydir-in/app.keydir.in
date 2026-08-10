'use client';

import Link from 'next/link';
import { ReportButton } from '@/components/report/report-button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div className="hero-eyebrow" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span className="dot" /> SYSTEM_CRASH // UNEXPECTED_ERROR
        </div>

        <h1 className="page-hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 0.9, marginBottom: '1.5rem' }}>
          SOMETHING<br />
          <span className="outline">BROKE</span>
        </h1>

        <p style={{ fontFamily: 'var(--f-m)', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.75 }}>
          An unexpected error occurred. Our team has been notified.
          {error.digest && (
            <>
              <br />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Ref: {error.digest}</span>
            </>
          )}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn-primary">TRY AGAIN</button>
          <Link href="/" className="btn-secondary">BACK TO HOME</Link>
          <ReportButton
            type="PAGE_ISSUE"
            instant
            message={`Unhandled runtime error${error.digest ? ` (Ref: ${error.digest})` : ''}`}
            className="btn-secondary"
          >
            [ REPORT THIS ERROR ]
          </ReportButton>
        </div>
      </div>
    </main>
  );
}
