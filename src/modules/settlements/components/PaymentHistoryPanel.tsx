'use client';

import { useState } from 'react';
import { useDebouncedValue, useMonthPaymentHistory } from '@/shared/hooks';

interface PaymentHistoryPanelProps {
  monthId: number | null;
  formatCurrency: (value: number) => string;
}

export function PaymentHistoryPanel({ monthId, formatCurrency }: PaymentHistoryPanelProps) {
  const [status, setStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { payments, pagination, loading, error } = useMonthPaymentHistory(monthId, {
    page,
    limit,
    status,
    search: debouncedSearch,
  });

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Lịch sử giao dịch</h2>
        <p className="mt-1 text-sm text-slate-600">Theo dõi QR đã tạo và trạng thái đã thu theo từng thành viên.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-6 py-4 md:grid-cols-4">
        <div>
          <label htmlFor="historyStatus" className="mb-1 block text-xs font-medium text-slate-600">
            Trạng thái
          </label>
          <select
            id="historyStatus"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'all' | 'paid' | 'unpaid');
              setPage(1);
            }}
            className="input-field"
          >
            <option value="all">Tất cả</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="historySearch" className="mb-1 block text-xs font-medium text-slate-600">
            Tìm thành viên
          </label>
          <input
            id="historySearch"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tên, email, user ID"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="historyPageSize" className="mb-1 block text-xs font-medium text-slate-600">
            Số dòng
          </label>
          <select
            id="historyPageSize"
            value={String(limit)}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="input-field"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="px-6 py-6 text-sm text-slate-600">Đang tải lịch sử giao dịch...</div>
      ) : payments.length === 0 ? (
        <div className="px-6 py-6 text-sm text-slate-600">Không có bản ghi giao dịch phù hợp.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Thành viên</th>
                <th className="px-4 py-3 font-medium">Tổng cần đóng</th>
                <th className="px-4 py-3 font-medium">Đã thu</th>
                <th className="px-4 py-3 font-medium">QR tạo lúc</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {payments.map((payment) => (
                <tr key={payment.settlement_id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{payment.user_name || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{payment.user_email || payment.user_id}</div>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(payment.total_due)}</td>
                  <td className="px-4 py-3">{payment.paid_amount ? formatCurrency(payment.paid_amount) : '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {payment.qr_created_at
                      ? new Date(payment.qr_created_at).toLocaleString('vi-VN')
                      : 'Chưa tạo'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        payment.is_paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {payment.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>
          Trang {pagination.page} / {pagination.totalPages} • Tổng bản ghi: {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="btn-secondary rounded-md px-3 py-2 text-sm disabled:opacity-50"
          >
            Trang trước
          </button>
          <button
            type="button"
            disabled={!pagination.hasMore || loading}
            onClick={() => setPage((prev) => prev + 1)}
            className="btn-secondary rounded-md px-3 py-2 text-sm disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      </div>
    </section>
  );
}
