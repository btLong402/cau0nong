'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const from = searchParams.get('from') || '/dashboard';
  const registered = searchParams.get('registered') === 'true';

  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (response.ok) {
          router.replace(from);
          return;
        }
      } catch {
        // Keep user on login page if session check fails.
      } finally {
        setCheckingSession(false);
      }
    }

    checkCurrentSession();
  }, [from, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Login failed');
        return;
      }

      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="surface-card-soft p-8">
        <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-10 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-10 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="surface-card p-7 sm:p-8">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Đăng nhập</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Chào mừng quay lại</h1>
        <p className="mt-2 text-sm text-slate-600">Đăng nhập để tiếp tục quản lý CLB cầu lông.</p>
      </div>

      {registered && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đăng ký thành công. Vui lòng đăng nhập để bắt đầu.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm text-rose-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div>
          <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-700">
            Email hoặc Số điện thoại
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="your@email.com hoặc 0909xxxxxx"
            className="input-field"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
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
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-65"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-medium text-blue-700 hover:text-blue-800">
          Đăng ký
        </Link>
      </div>
    </div>
  );
}
