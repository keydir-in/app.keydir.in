import { memo } from 'react';
import Link from 'next/link';
import { FooterThemeToggle } from './footer-theme-toggle';

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
          <h4>Legal</h4>
          <ul>
            <li><a href="https://keydir.in/terms-and-conditions/" rel="noopener noreferrer">_Terms &amp; Conditions</a></li>
             <li><a href="https://keydir.in/privacy-policy/" rel="noopener noreferrer">_Privacy Policy</a></li>
             <li><a href="https://keydir.in/disclaimer/" rel="noopener noreferrer">_Disclaimer</a></li>
          </ul>
        </div>
      </div>

      <div className="f-bottom">
        <div className="f-copy">
          © 2026 KeyDir — Built by SHADOW269
        </div>
        <FooterThemeToggle />
      </div>
      <div className="f-watermark">KEYDIR</div>
    </footer>
  );
});
