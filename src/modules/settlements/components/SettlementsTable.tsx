'use client';

import { SettlementListItem } from '@/shared/hooks';

interface SettlementsTableProps {
  settlements: SettlementListItem[];
  loading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  };
  monthLabel: string;
  onOpenPayment: (item: SettlementListItem) => void;
  onSortColumn: (field: 'total_due' | 'created_at' | 'paid_at' | 'user_id') => void;
  renderSortIndicator: (field: 'total_due' | 'created_at' | 'paid_at' | 'user_id') => string;
  onPrevPage: () => void;
  onNextPage: () => void;
  formatCurrency: (value: number) => string;
}

export function SettlementsTable({
  settlements,
  loading,
  pagination,
  monthLabel,
  onOpenPayment,
  onSortColumn,
  renderSortIndicator,
  onPrevPage,
  onNextPage,
  formatCurrency,
}: SettlementsTableProps) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-[var(--surface-border)] px-5 py-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Danh sách quyết toán {monthLabel}</h2>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12" />)}
        </div>
      ) : settlements.length === 0 ? (
        <div className="p-6 text-center text-sm text-[var(--muted)]">Không có kết quả phù hợp với bộ lọc hiện tại.</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden lg:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Tiền sân</th>
                  <th>Tiền cầu</th>
                  <th>Nợ cũ</th>
                  <th className="text-[var(--primary)]">Cấn trừ (ứng)</th>
                  <th className="text-[var(--danger)]">Nợ sự kiện</th>
                  <th>
                    <button
                      type="button"
                      onClick={() => onSortColumn('total_due')}
                      className="font-semibold text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      Tổng cần thu{renderSortIndicator('total_due')}
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      onClick={() => onSortColumn('created_at')}
                      className="font-semibold text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      Ngày tạo{renderSortIndicator('created_at')}
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      onClick={() => onSortColumn('paid_at')}
                      className="font-semibold text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      Ngày TT{renderSortIndicator('paid_at')}
                    </button>
                  </th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium text-[var(--foreground)]">{item.user_name || 'N/A'}</div>
                      <div className="text-xs text-[var(--muted)]">{item.user_email || 'N/A'}</div>
                    </td>
                    <td>{formatCurrency(item.court_fee)}</td>
                    <td>{formatCurrency(item.shuttlecock_fee)}</td>
                    <td>{formatCurrency(item.past_debt)}</td>
                    <td className="text-[var(--primary)]">-{formatCurrency(item.court_payer_offset + item.shuttlecock_buyer_offset)}</td>
                    <td className="text-[var(--danger)]">+{formatCurrency(item.event_debt)}</td>
                    <td className="font-semibold text-[var(--foreground)]">{formatCurrency(item.total_due)}</td>
                    <td className="text-xs text-[var(--muted)]">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="text-xs text-[var(--muted)]">
                      {item.paid_at ? new Date(item.paid_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${item.is_paid ? 'badge-success' : 'badge-warning'}`}>
                        {item.is_paid ? 'Đã TT' : 'Chưa TT'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        disabled={item.is_paid}
                        onClick={() => onOpenPayment(item)}
                        className="btn-primary h-auto min-h-0 rounded-md px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {item.is_paid ? 'Đã xác nhận' : 'TT / VietQR'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="card-list p-4 lg:hidden">
            {settlements.map((item) => (
              <div key={item.id} className="card-list-item">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.user_name || 'N/A'}</p>
                    <p className="text-xs text-[var(--muted)]">{item.user_email || 'N/A'}</p>
                  </div>
                  <span className={`badge ${item.is_paid ? 'badge-success' : 'badge-warning'}`}>
                    {item.is_paid ? 'Đã TT' : 'Chưa TT'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-[var(--foreground)]">{formatCurrency(item.total_due)}</p>
                  <button
                    type="button"
                    disabled={item.is_paid}
                    onClick={() => onOpenPayment(item)}
                    className="btn-primary h-auto min-h-0 rounded-md px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {item.is_paid ? 'Đã xác nhận' : 'VietQR'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 border-t border-[var(--surface-border)] px-5 py-4 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <p>
          Trang {pagination.page} / {pagination.totalPages} • Tổng: {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={onPrevPage}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Trước
          </button>
          <button
            type="button"
            disabled={!pagination.hasMore || loading}
            onClick={onNextPage}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
