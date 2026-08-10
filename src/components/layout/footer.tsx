import { memo } from 'react';
import Link from 'next/link';
import { FooterThemeToggle } from './footer-theme-toggle';
import { ReportButton } from '@/components/report/report-button';

export const Footer = memo(function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <div className="f-logo">⌨ KEYDIR.in</div>
          <div className="f-desc">
            India&apos;s mechanical keyboard and more database featuring price tracking, historical pricing, vendor
            comparison, community voting, and detailed product specifications.
          </div>
        </div>

        <div className="f-col">
          <h4>Explore</h4>
          <ul>
            <li><Link href="/keyboards">_Keyboards</Link></li>
            <li><Link href="/switches">_Switches</Link></li>
            <li><Link href="/keycaps">_Keycaps</Link></li>
            <li><Link href="/mouse">_Mouse</Link></li>
          </ul>
        </div>

        <div className="f-col">
          <h4>Features</h4>
          <ul>
            <li><Link href="/keyboards">_Price Comparison</Link></li>
            <li><Link href="/keyboards">_Price History</Link></li>
            <li><Link href="/keyboards">_Vendor Tracking</Link></li>
            <li><Link href="/keyboards">_Community Voting</Link></li>
            <li><Link href="/keyboards">_Product Database</Link></li>
            <li><Link href="/keyboards">_Specifications</Link></li>
          </ul>
        </div>

        <div className="f-col">
          <h4>Documentation</h4>
          <ul>
            <li><a href="https://keydir.in/app/terms" rel="noopener noreferrer">_Terms</a></li>
             <li><a href="https://keydir.in/app/privacy" rel="noopener noreferrer">_Privacy Policy</a></li>
             <li><a href="https://keydir.in/app/cookies" rel="noopener noreferrer">_Cookies</a></li>
             <li><a href="https://keydir.in/app/security" rel="noopener noreferrer">_Security</a></li>
             <li><a href="https://keydir.in/app/dmca" rel="noopener noreferrer">_DMCA</a></li>
          </ul>
        </div>
      </div>

        <div className="f-bottom">
          <div className="f-copy">
            © 2026 KeyDir — Built by SHADOW269
          </div>
          <div className="f-actions">
            <ReportButton type="PAGE_ISSUE" className="f-report-btn">Report Issue</ReportButton>
            <FooterThemeToggle />
          </div>
        </div>
      <div className="f-watermark">KEYDIR</div>
    </footer>
  );
});
