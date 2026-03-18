'use client';

import { useState } from 'react';
import { useDebouncedValue, useMonthPaymentHistory } from '@/shared/hooks';
import { CustomSelect } from '@/shared/components/CustomSelect';

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
      <div className="border-b border-[var(--surface-border)] px-5 py-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Lịch sử giao dịch</h2>
        <p className="mt-0.5 text-sm text-[var(--muted)]">Theo dõi QR đã tạo và trạng thái đã thu theo từng thành viên.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-[var(--surface-border)] px-5 py-4 md:grid-cols-4">
        <CustomSelect
          label="Trạng thái"
          value={status}
          onChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'paid', label: 'Đã thanh toán' },
            { value: 'unpaid', label: 'Chưa thanh toán' },
          ]}
        />

        <div className="md:col-span-2">
          <label htmlFor="historySearch" className="mb-1 block text-sm font-medium text-[var(--muted)]">
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

        <CustomSelect
          label="Số dòng"
          value={limit}
          onChange={(val) => {
            setLimit(val);
            setPage(1);
          }}
          options={[
            { value: 10, label: '10' },
            { value: 20, label: '20' },
            { value: 50, label: '50' },
          ]}
        />
      </div>

      {error && (
        <div className="border-b border-red-200 bg-[var(--danger-soft)] px-5 py-3 text-sm text-[var(--danger)]">
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 p-5">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-[var(--muted)]">Không có bản ghi giao dịch phù hợp.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden lg:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Tổng cần đóng</th>
                  <th>Đã thu</th>
                  <th>QR tạo lúc</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.settlement_id}>
                    <td>
                      <div className="font-medium text-[var(--foreground)]">{payment.user_name || 'N/A'}</div>
                      <div className="text-xs text-[var(--muted)]">{payment.user_email || payment.user_id}</div>
                    </td>
                    <td>{formatCurrency(payment.total_due)}</td>
                    <td>{payment.paid_amount ? formatCurrency(payment.paid_amount) : '—'}</td>
                    <td className="text-xs text-[var(--muted)]">
                      {payment.qr_created_at
                        ? new Date(payment.qr_created_at).toLocaleString('vi-VN')
                        : 'Chưa tạo'}
                    </td>
                    <td>
                      <span className={`badge ${payment.is_paid ? 'badge-success' : 'badge-warning'}`}>
                        {payment.is_paid ? 'Đã TT' : 'Chưa TT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="card-list p-4 lg:hidden">
            {payments.map((payment) => (
              <div key={payment.settlement_id} className="card-list-item">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{payment.user_name || 'N/A'}</p>
                    <p className="text-xs text-[var(--muted)]">{payment.user_email || payment.user_id}</p>
                  </div>
                  <span className={`badge ${payment.is_paid ? 'badge-success' : 'badge-warning'}`}>
                    {payment.is_paid ? 'Đã TT' : 'Chưa TT'}
                  </span>
                </div>
                <p className="text-base font-bold text-[var(--foreground)]">{formatCurrency(payment.total_due)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 border-t border-[var(--surface-border)] px-5 py-4 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <p>
          Trang {pagination.page} / {pagination.totalPages} • Tổng: {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Trước
          </button>
          <button
            type="button"
            disabled={!pagination.hasMore || loading}
            onClick={() => setPage((prev) => prev + 1)}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </section>
  );
}
