import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div className="hero-eyebrow" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span className="dot" /> ERROR_404 // PAGE_NOT_FOUND
        </div>

        <h1 className="page-hero-title" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 0.85, marginBottom: '1.5rem' }}>
          4<span className="outline">0</span>4
        </h1>

        <p style={{ fontFamily: 'var(--f-m)', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.75 }}>
          The page you&apos;re looking for doesn&apos;t exist — it may have been moved, renamed, or never existed at all.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary">BACK TO HOME</Link>
          <Link href="/keyboards" className="btn-secondary">BROWSE KEYBOARDS</Link>
        </div>
      </div>
    </main>
  );
}
