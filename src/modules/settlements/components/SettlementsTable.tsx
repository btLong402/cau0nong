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
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Danh sách quyết toán {monthLabel}</h2>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-slate-600">Đang tải dữ liệu quyết toán...</div>
      ) : settlements.length === 0 ? (
        <div className="p-6 text-sm text-slate-600">Không có kết quả phù hợp với bộ lọc hiện tại.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Thành viên</th>

                <th className="px-4 py-3 font-medium">Tiền sân</th>
                <th className="px-4 py-3 font-medium">Tiền cầu</th>
                <th className="px-4 py-3 font-medium">Nợ cũ</th>
                <th className="px-4 py-3 font-medium text-blue-700">Cấn trừ (ứng)</th>
                <th className="px-4 py-3 font-medium text-rose-700">Nợ sự kiện</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => onSortColumn('total_due')}
                    className="font-medium text-slate-700 hover:text-slate-900"
                  >
                    Tổng cần thu{renderSortIndicator('total_due')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => onSortColumn('created_at')}
                    className="font-medium text-slate-700 hover:text-slate-900"
                  >
                    Ngày tạo{renderSortIndicator('created_at')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => onSortColumn('paid_at')}
                    className="font-medium text-slate-700 hover:text-slate-900"
                  >
                    Ngày thanh toán{renderSortIndicator('paid_at')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
              {settlements.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{item.user_name || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{item.user_email || 'N/A'}</div>
                  </td>

                  <td className="px-4 py-3">{formatCurrency(item.court_fee)}</td>
                  <td className="px-4 py-3">{formatCurrency(item.shuttlecock_fee)}</td>
                  <td className="px-4 py-3">{formatCurrency(item.past_debt)}</td>
                  <td className="px-4 py-3 text-blue-700">-{formatCurrency(item.court_payer_offset + item.shuttlecock_buyer_offset)}</td>
                  <td className="px-4 py-3 text-rose-700">+{formatCurrency(item.event_debt)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(item.total_due)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {item.paid_at ? new Date(item.paid_at).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.is_paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {item.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={item.is_paid}
                      onClick={() => onOpenPayment(item)}
                      className="btn-primary h-auto min-h-0 rounded-md bg-emerald-600 px-3 py-2 text-xs hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item.is_paid ? 'Đã xác nhận' : 'Thanh toán / VietQR'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>
          Trang {pagination.page} / {pagination.totalPages} • Tổng bản ghi: {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={onPrevPage}
            className="btn-secondary rounded-md px-3 py-2 text-sm disabled:opacity-50"
          >
            Trang trước
          </button>
          <button
            type="button"
            disabled={!pagination.hasMore || loading}
            onClick={onNextPage}
            className="btn-secondary rounded-md px-3 py-2 text-sm disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
}
