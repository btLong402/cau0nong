'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/shared/hooks';

function LoginSkeleton() {
  return (
    <div className="surface-card p-8">
      <div className="skeleton h-5 w-36" />
      <div className="skeleton mt-5 h-11" />
      <div className="skeleton mt-3 h-11" />
      <div className="skeleton mt-4 h-11" />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = searchParams.get('from') || '/dashboard';
  const pendingApproval = searchParams.get('pendingApproval') === 'true';

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(from);
    }
  }, [authLoading, user, from, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      router.replace(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <LoginSkeleton />;
  }

  return (
    <div className="surface-card p-7 sm:p-8">
      <div className="mb-7">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
          <svg className="h-5 w-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Chào mừng quay lại</h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">Đăng nhập để tiếp tục quản lý CLB cầu lông.</p>
      </div>

      {pendingApproval && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đăng ký thành công. Tài khoản của bạn đang chờ admin duyệt trước khi đăng nhập.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div>
          <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Username (hoặc Email/Số điện thoại)
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username, your@email.com hoặc 0909xxxxxx"
            className="input-field"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--muted)]">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
          Đăng ký
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
