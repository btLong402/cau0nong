'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  profile: {
    id: string;
    name: string;
    phone: string;
    email: string;
    balance: number;
    role: string;
  } | null;
  current_month: {
    month_id: number;
    month_year: string;
    status: string;
    total_sessions: number;
    sessions_attended: number;
  } | null;
  current_settlement: {
    id: number;
    court_fee: number;
    shuttlecock_fee: number;
    past_debt: number;
    balance_carried: number;
    court_payer_offset: number;
    shuttlecock_buyer_offset: number;
    event_debt: number;
    total_due: number;
    is_paid: boolean;
    paid_amount: number | null;
  } | null;
  payment_history: Array<{
    month_year: string;
    court_fee: number;
    shuttlecock_fee: number;
    total_due: number;
    is_paid: boolean;
    paid_amount: number | null;
    paid_at: string | null;
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function MyAccountPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/me/dashboard', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load dashboard');
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
        {error || 'Không thể tải dữ liệu'}
      </div>
    );
  }

  const { profile, current_month, current_settlement, payment_history } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trang cá nhân</h1>
        <p className="text-sm text-slate-500 mt-1">
          Thông tin tài khoản và công nợ của bạn
        </p>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Thông tin cá nhân
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Họ tên</p>
              <p className="text-sm font-medium text-slate-900">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Số điện thoại</p>
              <p className="text-sm font-medium text-slate-900">{profile.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Số dư tài khoản</p>
              <p className={`text-sm font-semibold ${profile.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(profile.balance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Month Summary */}
      {current_month && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-xs text-slate-400 mb-1">Tháng hiện tại</p>
            <p className="text-lg font-bold text-slate-900">
              {formatMonth(current_month.month_year)}
            </p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              current_month.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {current_month.status === 'open' ? 'Đang mở' : 'Đã đóng'}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-xs text-slate-400 mb-1">Buổi tham gia</p>
            <p className="text-lg font-bold text-blue-700">
              {current_month.sessions_attended} / {current_month.total_sessions}
            </p>
            <p className="text-xs text-slate-400 mt-1">buổi</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-xs text-slate-400 mb-1">Tiền cần đóng</p>
            <p className={`text-lg font-bold ${
              current_settlement?.is_paid ? 'text-green-700' : 'text-red-700'
            }`}>
              {current_settlement
                ? formatCurrency(current_settlement.total_due)
                : '—'}
            </p>
            {current_settlement && (
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                current_settlement.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {current_settlement.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Settlement Breakdown */}
      {current_settlement && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Chi tiết công nợ tháng này
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tiền sân</span>
              <span className="font-medium">{formatCurrency(current_settlement.court_fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tiền cầu</span>
              <span className="font-medium">{formatCurrency(current_settlement.shuttlecock_fee)}</span>
            </div>
            {current_settlement.past_debt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Nợ tồn đọng</span>
                <span className="font-medium text-red-600">+{formatCurrency(current_settlement.past_debt)}</span>
              </div>
            )}
            {current_settlement.event_debt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-orange-600">Tiền sự kiện</span>
                <span className="font-medium text-orange-600">+{formatCurrency(current_settlement.event_debt)}</span>
              </div>
            )}
            {current_settlement.balance_carried > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Tiền thừa tháng trước</span>
                <span className="font-medium text-green-600">-{formatCurrency(current_settlement.balance_carried)}</span>
              </div>
            )}
            {current_settlement.court_payer_offset > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Đã ứng tiền sân</span>
                <span className="font-medium text-green-600">-{formatCurrency(current_settlement.court_payer_offset)}</span>
              </div>
            )}
            {current_settlement.shuttlecock_buyer_offset > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Đã ứng tiền cầu</span>
                <span className="font-medium text-green-600">-{formatCurrency(current_settlement.shuttlecock_buyer_offset)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-sm font-bold">
              <span className="text-slate-900">Tổng cần thanh toán</span>
              <span className={current_settlement.is_paid ? 'text-green-700' : 'text-red-700'}>
                {formatCurrency(current_settlement.total_due)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payment_history.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Lịch sử thanh toán
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2 text-left font-medium text-slate-500">Tháng</th>
                  <th className="py-2 text-right font-medium text-slate-500">Tiền sân</th>
                  <th className="py-2 text-right font-medium text-slate-500">Tiền cầu</th>
                  <th className="py-2 text-right font-medium text-slate-500">Tổng</th>
                  <th className="py-2 text-center font-medium text-slate-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payment_history.map((item) => (
                  <tr key={item.month_year} className="border-b border-slate-50">
                    <td className="py-2 text-slate-900 font-medium">
                      {formatMonth(item.month_year)}
                    </td>
                    <td className="py-2 text-right text-slate-600">
                      {formatCurrency(item.court_fee)}
                    </td>
                    <td className="py-2 text-right text-slate-600">
                      {formatCurrency(item.shuttlecock_fee)}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {formatCurrency(item.total_due)}
                    </td>
                    <td className="py-2 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.is_paid ? 'Đã đóng' : 'Chưa đóng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!current_month && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-slate-500">Chưa có kỳ quản lý nào được tạo.</p>
        </div>
      )}
    </div>
  );
}
