'use client';

/**
 * Main navigation bar with category links, global search, compare tray
 * badge, and auth-dependent profile dropdown. Includes mobile drawer
 * navigation and external "More" dropdown.
 * Rendered once in the ROOT layout (src/app/layout.tsx) so it persists
 * across navigations — do NOT add it to individual pages.
 * Exports: Navbar
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { logout, getCurrentUser } from '@/lib/auth/actions';
import {
  GitCompareArrows, ChevronDown, Keyboard, ToggleRight, CircleDot, Mouse,
  ShoppingCart, BookOpen, Hammer, Layers, Mail, User, Settings, LogOut, X
} from 'lucide-react';
import { loadCompareFromStorage } from '@/lib/compare-store';
import Image from 'next/image';

const GlobalSearch = lazy(
  () => import('./global-search').then((m) => ({ default: m.GlobalSearch }))
);

const NAV_ITEMS = [
  { href: '/keyboards', label: 'Keyboards' },
  { href: '/switches', label: 'Switches' },
  { href: '/keycaps', label: 'Keycaps' },
  { href: '/mouse', label: 'Mouse' },
];

const MORE_ITEMS = [
  { href: 'https://keydir.in/groupbuy/', label: 'Group Buy', external: true },
  { href: 'https://keydir.in/guide/', label: 'Guide', external: true },
  { href: 'https://keydir.in/builders/', label: 'Builders', external: true },
  { href: 'https://keydir.in/surfaces/', label: 'Surfaces', external: true },
  { href: 'https://keydir.in/contact/', label: 'Contact', external: true },
];

const MOB_CATALOG = [
  { href: '/keyboards', label: 'Keyboards', icon: Keyboard },
  { href: '/switches', label: 'Switches', icon: ToggleRight },
  { href: '/keycaps', label: 'Keycaps', icon: CircleDot },
  { href: '/mouse', label: 'Mouse', icon: Mouse },
];

const MOB_DIRECTORY = [
  { href: 'https://keydir.in/groupbuy/', label: 'Group Buy', icon: ShoppingCart, external: true },
  { href: 'https://keydir.in/builders/', label: 'Builders', icon: Hammer, external: true },
  { href: 'https://keydir.in/surfaces/', label: 'Surfaces', icon: Layers, external: true },
];

const MOB_RESOURCES = [
  { href: 'https://keydir.in/guide/', label: 'Guide', icon: BookOpen, external: true },
  { href: 'https://keydir.in/contact/', label: 'Contact', icon: Mail, external: true },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ username: string; isAdmin: boolean; avatarUrl: string | null; displayName: string | null; email: string | null } | null>(null);
  const [compareCount, setCompareCount] = useState(0);
  const [compareCategory, setCompareCategory] = useState<string | null>(null);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  useEffect(() => {
    const stored = loadCompareFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompareCount(stored.products.length);
    setCompareCategory(stored.category);
    setCompareSlugs(stored.products.map((p) => p.slug));
    getCurrentUser().then((data) => {
      if (data) {
        setUser({
          username: data.username,
          isAdmin: data.isAdmin,
          avatarUrl: data.avatarUrl,
          displayName: data.displayName,
          email: data.email,
        });
        setAvatarFailed(false);
      }
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    const delta = touchStartX.current - touchCurrentX.current;
    if (delta > 60) setMobileOpen(false);
  }, []);

  function closeMobile() { setMobileOpen(false); }

  function isActive(href: string) {
    return pathname === href || pathname === href + '/';
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-block">
          <Link href="/" className="nav-logo">
            <span style={{ fontSize: '.7em' }}>⌨</span> KEYDIR.in
          </Link>
          <div className="nav-links">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? 'active' : ''}
              >
                _{item.label}
              </Link>
            ))}
            <div ref={moreRef} className={`nav-dropdown-wrap${moreOpen ? ' active' : ''}`}>
              <button
                className="nav-dropdown-btn"
                onClick={(e) => { e.stopPropagation(); setMoreOpen(!moreOpen); }}
              >
                _More
              </button>
              <div className="nav-dropdown-menu">
                {MORE_ITEMS.map((item) => (
                  item.external ? (
                    <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                      _{item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={isActive(item.href) ? 'active' : ''}
                      onClick={() => setMoreOpen(false)}
                    >
                      _{item.label}
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <Suspense fallback={null}>
            <GlobalSearch />
          </Suspense>

          {compareCount > 0 && (
            <Link
              href={compareSlugs.length > 0
                ? `/compare/${compareCategory || 'keyboards'}?products=${compareSlugs.join(',')}`
                : `/compare/${compareCategory || 'keyboards'}`}
              className="nav-compare-icon"
              aria-label={`Compare ${compareCount} product${compareCount !== 1 ? 's' : ''}`}
            >
              <GitCompareArrows size={18} strokeWidth={1.5} />
              <span className="nav-compare-badge">{Math.min(compareCount, 4)}</span>
            </Link>
          )}

          {user ? (
            <div ref={profileRef} className={`nav-profile${profileOpen ? ' open' : ''}`}>
              <button
                className="nav-profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                {user.avatarUrl && !avatarFailed ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    onError={() => setAvatarFailed(true)}
                  />
                ) : null}
                <span>{user.displayName || user.username}</span>
                <ChevronDown size={12} />
              </button>
              <div className="nav-dropdown">
                <Link href={`/profile/${user.username}`} onClick={() => setProfileOpen(false)}>
                  Profile
                </Link>
                <Link href="/settings" onClick={() => setProfileOpen(false)}>
                  Settings
                </Link>
                <form action={logout}>
                  <button type="submit">Sign Out</button>
                </form>
              </div>
            </div>
          ) : (
            <Link href={`/auth/login?next=${encodeURIComponent(pathname)}`} className="nav-login">
              Login
            </Link>
          )}

          <button
            className={`nav-ham${mobileOpen ? ' open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mob-drawer-backdrop${mobileOpen ? ' open' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        className={`mob-drawer${mobileOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="mob-drawer-header">
          {user ? (
            <Link href={`/profile/${user.username}`} className="mob-drawer-user" onClick={closeMobile}>
              <div className="mob-drawer-avatar">
                {user.avatarUrl && !avatarFailed ? (
                  <Image src={user.avatarUrl} alt="" width={36} height={36} unoptimized style={{ borderRadius: '50%', objectFit: 'cover' }} onError={() => setAvatarFailed(true)} />
                ) : (
                  <div className="mob-drawer-avatar-fallback">{(user.displayName || user.username).charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="mob-drawer-user-info">
                <div className="mob-drawer-username">{user.displayName || user.username}</div>
                <div className="mob-drawer-member">Member</div>
              </div>
            </Link>
          ) : (
            <Link href={`/auth/login?next=${encodeURIComponent(pathname)}`} className="mob-drawer-user" onClick={closeMobile}>
              <div className="mob-drawer-avatar">
                <User size={20} />
              </div>
              <div className="mob-drawer-user-info">
                <div className="mob-drawer-username">Sign In</div>
                <div className="mob-drawer-member">Access your account</div>
              </div>
            </Link>
          )}
          <button className="mob-drawer-close" onClick={closeMobile} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="mob-drawer-body">
          <div className="mob-drawer-section">
            <div className="mob-drawer-section-label">Catalog</div>
            {MOB_CATALOG.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`mob-drawer-item${isActive(href) ? ' active' : ''}`} onClick={closeMobile}>
                <Icon size={18} strokeWidth={1.5} className="mob-drawer-icon" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="mob-drawer-divider" />

          <div className="mob-drawer-section">
            <div className="mob-drawer-section-label">Directory</div>
            {MOB_DIRECTORY.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="mob-drawer-item" onClick={closeMobile}>
                <Icon size={18} strokeWidth={1.5} className="mob-drawer-icon" />
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="mob-drawer-divider" />

          <div className="mob-drawer-section">
            <div className="mob-drawer-section-label">Resources</div>
            {MOB_RESOURCES.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="mob-drawer-item" onClick={closeMobile}>
                <Icon size={18} strokeWidth={1.5} className="mob-drawer-icon" />
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="mob-drawer-divider" />

          <div className="mob-drawer-section">
            <div className="mob-drawer-section-label">Account</div>
            {user ? (
              <>
                <Link href={`/profile/${user.username}`} className={`mob-drawer-item${isActive(`/profile/${user.username}`) ? ' active' : ''}`} onClick={closeMobile}>
                  <User size={18} strokeWidth={1.5} className="mob-drawer-icon" />
                  <span>Profile</span>
                </Link>
                <Link href="/settings" className={`mob-drawer-item${isActive('/settings') ? ' active' : ''}`} onClick={closeMobile}>
                  <Settings size={18} strokeWidth={1.5} className="mob-drawer-icon" />
                  <span>Settings</span>
                </Link>
                <form action={logout}>
                  <button type="submit" className="mob-drawer-item" onClick={closeMobile}>
                    <LogOut size={18} strokeWidth={1.5} className="mob-drawer-icon" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </>
            ) : (
              <Link href={`/auth/login?next=${encodeURIComponent(pathname)}`} className="mob-drawer-item" onClick={closeMobile}>
                <User size={18} strokeWidth={1.5} className="mob-drawer-icon" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
