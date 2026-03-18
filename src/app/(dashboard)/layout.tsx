'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user
    async function fetchUser() {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem('auth_token');
          router.push('/login');
          return;
        }

        const data = await response.json();
        setUser(data.data?.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  async function handleLogout() {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      router.push('/login');
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
    <html lang="vi">
      <body className="bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-800 text-white shadow-lg">
            <div className="p-6">
              <h1 className="text-2xl font-bold">CLB Cầu Lông</h1>
              <p className="text-slate-400 text-sm mt-1">Quản lý câu lạc bộ</p>
            </div>

            <nav className="mt-8 space-y-2 px-4">
              <Link
                href="/dashboard"
                className="block px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/dashboard/members"
                className="block px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                👥 Thành viên
              </Link>
              <Link
                href="/dashboard/months"
                className="block px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                📅 Kỳ quản lý
              </Link>
              <Link
                href="/dashboard/sessions"
                className="block px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                🎾 Buổi tập
              </Link>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
              <div className="mb-4">
                <p className="text-sm text-slate-400">Đăng nhập với tư cách</p>
                <p className="font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {user?.role === 'admin' ? '👨‍💼 Quản trị viên' : '👤 Thành viên'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition"
              >
                Đăng xuất
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
