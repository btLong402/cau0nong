'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'member';
}

const navItems = [
  { href: '/dashboard', label: 'Tong quan' },
  { href: '/dashboard/members', label: 'Thanh vien' },
  { href: '/dashboard/months', label: 'Ky quan ly' },
  { href: '/dashboard/sessions', label: 'Buoi tap' },
  { href: '/dashboard/settlements', label: 'Quyet toan' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });

        if (!response.ok) {
          router.replace(`/login?from=${encodeURIComponent(pathname)}`);
          return;
        }

        const data = await response.json();
        setUser(data.data?.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [pathname, router]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.replace('/login');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1380px] gap-4 md:gap-6">
        <aside className="surface-card hidden w-[260px] flex-col overflow-hidden lg:flex">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">He thong</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">CLB Cau Long</h1>
            <p className="mt-1 text-sm text-slate-600">Quan ly toan bo van hanh</p>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{user.name || user.email}</p>
              <p className="mt-1 text-xs text-slate-600">
                {user.role === 'admin' ? 'Quan tri vien' : 'Thanh vien'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary mt-3 w-full border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              Dang xuat
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
          <header className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
              <h2 className="text-xl font-semibold text-slate-900">Van hanh CLB</h2>
            </div>
            <div className="flex items-center gap-3">
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
                {user.role === 'admin' ? 'Admin' : 'Member'}
              </p>
              <button
                onClick={handleLogout}
                className="btn-secondary lg:hidden"
              >
                Dang xuat
              </button>
            </div>
          </header>

          <main className="surface-card min-h-[calc(100vh-180px)] overflow-auto px-4 py-5 md:px-6 md:py-6">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}
