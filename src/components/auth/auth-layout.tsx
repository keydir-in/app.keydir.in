/**
 * Auth page layout with navbar, footer, and a terminal-style header section.
 * Splits the title on newlines for a multi-line hero display with feature
 * bullets alongside the auth form children.
 * Exports: AuthLayout
 */

import { Footer } from '@/components/layout/footer';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  const lines = title.split('\n');

  return (
    <>
      <main className="page-hero">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="dot" /> SYSTEM_ONLINE // USER_AUTH_V2
            </div>

            <h1 className="page-hero-title" style={{ animation: 'fade-up .65s .08s ease both' }}>
              {lines.map((line, i) => (
                <span key={i}>
                  {i === lines.length - 2 ? (
                    <span className="outline">{line}</span>
                  ) : (
                    line
                  )}
                  {i < lines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <div className="page-hero-sub" style={{ animation: 'fade-up .65s .16s ease both' }}>
              <ul className="auth-features">
                <li>Track your favourite keyboards</li>
                <li>Save price alerts</li>
                <li>Collection &amp; order tracking</li>
                <li>Community features</li>
              </ul>
            </div>
          </div>

          <div className="hero-right" style={{ animation: 'fade-up .7s .15s ease both' }}>
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
