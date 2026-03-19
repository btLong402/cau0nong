'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/shared/hooks';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardLayoutProps {
  children: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Nav configuration                                                  */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: string; // icon key
}

const adminNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'home' },
  { href: '/dashboard/my-account', label: 'Cá nhân', icon: 'user' },
  { href: '/dashboard/members', label: 'Thành viên', icon: 'users' },
  { href: '/dashboard/months', label: 'Kỳ quản lý', icon: 'calendar' },
  { href: '/dashboard/sessions', label: 'Buổi tập', icon: 'clipboard' },
  { href: '/dashboard/settlements', label: 'Quyết toán', icon: 'wallet' },
  { href: '/dashboard/events', label: 'Sự kiện', icon: 'star' },
  { href: '/dashboard/videos', label: 'Video', icon: 'play' },
];

const memberNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'home' },
  { href: '/dashboard/my-account', label: 'Cá nhân', icon: 'user' },
  { href: '/dashboard/members', label: 'Thành viên', icon: 'users' },
  { href: '/dashboard/months', label: 'Kỳ quản lý', icon: 'calendar' },
  { href: '/dashboard/sessions', label: 'Buổi tập', icon: 'clipboard' },
  { href: '/dashboard/settlements', label: 'Quyết toán', icon: 'wallet' },
  { href: '/dashboard/events', label: 'Sự kiện', icon: 'star' },
  { href: '/dashboard/videos', label: 'Video', icon: 'play' },
];

// Bottom nav tabs (mobile) — max 5
const adminBottomTabs: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'home' },
  { href: '/dashboard/months', label: 'Kỳ', icon: 'calendar' },
  { href: '/dashboard/settlements', label: 'Quyết toán', icon: 'wallet' },
  { href: '/dashboard/my-account', label: 'Cá nhân', icon: 'user' },
];

const memberBottomTabs: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'home' },
  { href: '/dashboard/months', label: 'Kỳ', icon: 'calendar' },
  { href: '/dashboard/settlements', label: 'Quyết toán', icon: 'wallet' },
  { href: '/dashboard/my-account', label: 'Cá nhân', icon: 'user' },
];

/* ------------------------------------------------------------------ */
/*  SVG Icons (inline, no external deps)                               */
/* ------------------------------------------------------------------ */

function NavIcon({ name, className = '' }: { name: string; className?: string }) {
  const cn = `${className}`.trim();
  const props = { className: cn, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.75 };

  switch (name) {
    case 'home':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
    case 'user':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
    case 'users':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    case 'calendar':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
    case 'clipboard':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H10.5A2.25 2.25 0 008.149 4.028m-5.8 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664M6.75 7.5h10.5" /></svg>;
    case 'wallet':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6m-18 6h18M15 12a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg>;
    case 'star':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
    case 'play':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>;
    case 'menu':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
    case 'logout':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
    case 'x':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  User avatar                                                        */
/* ------------------------------------------------------------------ */

function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
}) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar của ${name}`}
        className={`${sizeClass} rounded-full object-cover border border-[var(--surface-border)]`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-[var(--primary-soft)] font-bold text-[var(--primary)]`}>
      {initial}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Layout                                                   */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Capture current path from window, not from dependencies to avoid re-runs
      const fromPath = typeof window !== 'undefined' 
        ? window.location.pathname 
        : '/dashboard';
      router.replace(`/login?from=${encodeURIComponent(fromPath)}`);
    }
  }, [loading, user, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  /* Loading */
  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = user.role === 'admin' ? adminNavItems : memberNavItems;
  const bottomTabs = user.role === 'admin' ? adminBottomTabs : memberBottomTabs;

  // Items that are in the bottom tabs (for the drawer to show the rest)
  const bottomTabHrefs = new Set(bottomTabs.map((t) => t.href));
  const drawerItems = navItems.filter((item) => !bottomTabHrefs.has(item.href));

  return (
    <div className="app-shell min-h-screen">
      {/* ============================================================ */}
      {/* SIDEBAR — Desktop only (lg+)                                  */}
      {/* ============================================================ */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[var(--sidebar-width)] flex-col border-r border-[var(--surface-border)] bg-[var(--surface)] lg:flex">
        {/* Brand */}
        <Link 
          href="/dashboard"
          className="block border-b border-[var(--surface-border)] px-5 py-5 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--foreground)]">CLB Cầu Lông</p>
              <p className="truncate text-xs text-[var(--muted)]">Quản lý vận hành</p>
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <NavIcon name={item.icon} className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--surface-border)] p-4">
          <div className="flex items-center gap-3 rounded-lg bg-[var(--surface-hover)] p-3">
            <UserAvatar name={user.name || user.email} avatarUrl={user.avatar_url} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {user.name || user.email}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--danger-soft)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)] cursor-pointer"
          >
            <NavIcon name="logout" className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT                                                  */}
      {/* ============================================================ */}
      <main className="lg:ml-[var(--sidebar-width)]">
        <div className="mx-auto max-w-[1200px] px-4 py-4 pb-24 md:px-6 md:py-6 lg:pb-6">
          {children}
        </div>
      </main>

      {/* ============================================================ */}
      {/* BOTTOM NAV — Mobile only (< lg)                               */}
      {/* ============================================================ */}
      <nav className="bottom-nav lg:hidden">
        {bottomTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottom-nav-item ${isActive(tab.href) ? 'active' : ''}`}
          >
            <NavIcon name={tab.icon} />
            <span>{tab.label}</span>
          </Link>
        ))}
        {/* Menu button (opens drawer for extra items) */}
        {drawerItems.length > 0 && (
          <button
            onClick={() => setDrawerOpen(true)}
            className={`bottom-nav-item ${drawerOpen ? 'active' : ''}`}
          >
            <NavIcon name="menu" />
            <span>Menu</span>
          </button>
        )}
      </nav>

      {/* ============================================================ */}
      {/* MOBILE DRAWER                                                 */}
      {/* ============================================================ */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-panel lg:hidden">
            <div className="drawer-handle" />

            {/* User info */}
            <div className="flex items-center gap-3 px-5 pb-3 mb-1 border-b border-[var(--surface-border)]">
              <UserAvatar name={user.name || user.email} avatarUrl={user.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                </p>
              </div>
            </div>

            {/* Extra nav items */}
            {drawerItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`drawer-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            ))}

            {/* Logout */}
            <div className="border-t border-[var(--surface-border)] mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="drawer-item text-[var(--danger)]"
              >
                <NavIcon name="logout" className="h-5 w-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
