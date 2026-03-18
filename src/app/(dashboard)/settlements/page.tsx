'use client';

import { useMemo, useState } from 'react';
import {
  useDebouncedValue,
  useGenerateMonthSettlements,
  useMarkSettlementPaid,
  useMonthSettlements,
  useMonths,
} from '@/shared/hooks';

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString('vi-VN')} đ`;
}

function formatMonthLabel(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function SettlementsPage() {
  const { months, loading: monthsLoading, error: monthsError } = useMonths();
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchUser, setSearchUser] = useState('');
  const debouncedSearchUser = useDebouncedValue(searchUser, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<'total_due' | 'created_at' | 'paid_at' | 'user_id'>('total_due');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageError, setPageError] = useState<string | null>(null);

  const defaultMonthId = useMemo(() => {
    if (months.length === 0) {
      return null;
    }

    const openMonth = months.find((month) => month.status === 'open');
    return openMonth?.id || months[0].id;
  }, [months]);

  const activeMonthId = selectedMonthId ?? defaultMonthId;

  const {
    settlements,
    pagination,
    loading: settlementsLoading,
    error: settlementsError,
    refetch,
  } = useMonthSettlements(activeMonthId, {
    page,
    limit,
    status: paymentFilter,
    search: debouncedSearchUser,
    sortBy,
    sortOrder,
  });

  const {
    generate,
    loading: generating,
    error: generateError,
    data: generateSummary,
  } = useGenerateMonthSettlements(activeMonthId);

  const {
    markPaid,
    loading: paying,
    error: payError,
  } = useMarkSettlementPaid();

  const totals = useMemo(() => {
    const totalDue = settlements.reduce((sum, item) => sum + item.total_due, 0);
    const unpaidCount = settlements.filter((item) => !item.is_paid).length;
    const paidCount = settlements.length - unpaidCount;

    return {
      totalDue,
      unpaidCount,
      paidCount,
    };
  }, [settlements]);

  const selectedMonth = months.find((item) => item.id === activeMonthId) || null;

  function resetToFirstPage() {
    setPage(1);
  }

  function handleSortColumn(field: 'total_due' | 'created_at' | 'paid_at' | 'user_id') {
    setSortBy((prevSortBy) => {
      if (prevSortBy === field) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return prevSortBy;
      }

      setSortOrder(field === 'user_id' ? 'asc' : 'desc');
      return field;
    });

    resetToFirstPage();
  }

  function renderSortIndicator(field: 'total_due' | 'created_at' | 'paid_at' | 'user_id') {
    if (sortBy !== field) {
      return ' ↕';
    }

    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  }

  async function handleGenerate(force: boolean = false) {
    setPageError(null);

    try {
      await generate(force);
      resetToFirstPage();
      await refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tạo dữ liệu quyết toán';
      setPageError(message);
    }
  }

  async function handleMarkPaid(settlementId: number, totalDue: number) {
    setPageError(null);

    try {
      await markPaid(settlementId, totalDue);
      await refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể xác nhận thanh toán';
      setPageError(message);
    }
  }

  if (monthsLoading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />;
  }

  if (monthsError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        Không thể tải danh sách kỳ quản lý.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Quyết toán tháng</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý tổng công nợ, theo dõi trạng thái thanh toán và xác nhận thu tiền.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={!activeMonthId || generating}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'Đang tạo...' : 'Tạo quyết toán'}
          </button>
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={!activeMonthId || generating}
            className="btn-primary bg-amber-600 hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'Đang xử lý...' : 'Tạo lại (force)'}
          </button>
        </div>
      </div>

      <div className="surface-card p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="monthSelect" className="mb-2 block text-sm font-medium text-slate-700">
              Chọn kỳ quản lý
            </label>
            <select
              id="monthSelect"
              value={activeMonthId || ''}
              onChange={(event) => setSelectedMonthId(Number(event.target.value))}
              onBlur={resetToFirstPage}
              className="input-field"
            >
              {months.map((month) => (
                <option key={month.id} value={month.id}>
                  {formatMonthLabel(month.month_year)} ({month.status === 'open' ? 'Đang mở' : 'Đã đóng'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="statusFilter" className="mb-2 block text-sm font-medium text-slate-700">
              Lọc thanh toán
            </label>
            <select
              id="statusFilter"
              value={paymentFilter}
              onChange={(event) => {
                setPaymentFilter(event.target.value as 'all' | 'paid' | 'unpaid');
                resetToFirstPage();
              }}
              className="input-field"
            >
              <option value="all">Tất cả</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thanh toán</option>
            </select>
          </div>

          <div>
            <label htmlFor="searchUser" className="mb-2 block text-sm font-medium text-slate-700">
              Tìm theo tên, email hoặc User ID
            </label>
            <input
              id="searchUser"
              value={searchUser}
              onChange={(event) => {
                setSearchUser(event.target.value);
                resetToFirstPage();
              }}
              placeholder="Ví dụ: long hoặc @caulongclb.local"
              className="input-field"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="sortBy" className="mb-2 block text-sm font-medium text-slate-700">
              Sắp xếp theo
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as 'total_due' | 'created_at' | 'paid_at' | 'user_id');
                resetToFirstPage();
              }}
              className="input-field"
            >
              <option value="total_due">Tổng cần thu</option>
              <option value="created_at">Ngày tạo quyết toán</option>
              <option value="paid_at">Ngày thanh toán</option>
              <option value="user_id">User ID</option>
            </select>
          </div>

          <div>
            <label htmlFor="sortOrder" className="mb-2 block text-sm font-medium text-slate-700">
              Thứ tự
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as 'asc' | 'desc');
                resetToFirstPage();
              }}
              className="input-field"
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>

          <div>
            <label htmlFor="pageSize" className="mb-2 block text-sm font-medium text-slate-700">
              Số dòng mỗi trang
            </label>
            <select
              id="pageSize"
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                resetToFirstPage();
              }}
              className="input-field"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {(pageError || settlementsError || generateError || payError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pageError || settlementsError?.message || generateError?.message || payError?.message}
        </div>
      )}

      {generateSummary && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Hoàn tất tạo quyết toán cho tháng {generateSummary.monthId}: {generateSummary.generatedCount} dòng,
          tổng cần thu {formatCurrency(generateSummary.totalDue)}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Tổng cần thu</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalDue)}</p>
        </article>
        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Đã thanh toán</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{totals.paidCount}</p>
        </article>
        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Chưa thanh toán</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{totals.unpaidCount}</p>
        </article>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Danh sách quyết toán {selectedMonth ? `- ${formatMonthLabel(selectedMonth.month_year)}` : ''}
          </h2>
        </div>

        {settlementsLoading ? (
          <div className="p-6 text-sm text-slate-600">Đang tải dữ liệu quyết toán...</div>
        ) : settlements.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            {pagination.total === 0
              ? 'Chưa có dữ liệu quyết toán cho kỳ này. Hãy bấm "Tạo quyết toán".'
              : 'Không có kết quả phù hợp với bộ lọc hiện tại.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Thành viên</th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSortColumn('user_id')}
                      className="font-medium text-slate-700 hover:text-slate-900"
                    >
                      User ID{renderSortIndicator('user_id')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Tiền sân</th>
                  <th className="px-4 py-3 font-medium">Tiền cầu</th>
                  <th className="px-4 py-3 font-medium">Nợ cũ</th>
                  <th className="px-4 py-3 font-medium">Số dư trừ</th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSortColumn('total_due')}
                      className="font-medium text-slate-700 hover:text-slate-900"
                    >
                      Tổng cần thu{renderSortIndicator('total_due')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSortColumn('created_at')}
                      className="font-medium text-slate-700 hover:text-slate-900"
                    >
                      Ngày tạo{renderSortIndicator('created_at')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSortColumn('paid_at')}
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
                    <td className="px-4 py-3 font-mono text-xs">{item.user_id}</td>
                    <td className="px-4 py-3">{formatCurrency(item.court_fee)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.shuttlecock_fee)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.past_debt)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.balance_carried)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(item.total_due)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.paid_at ? new Date(item.paid_at).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.is_paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {item.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={item.is_paid || paying}
                        onClick={() => handleMarkPaid(item.id, item.total_due)}
                        className="btn-primary h-auto min-h-0 rounded-md bg-emerald-600 px-3 py-2 text-xs hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {paying ? 'Đang xử lý...' : 'Xác nhận đã thu'}
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
              disabled={pagination.page <= 1 || settlementsLoading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="btn-secondary rounded-md px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={!pagination.hasMore || settlementsLoading}
              onClick={() => setPage((prev) => prev + 1)}
              className="btn-secondary rounded-md px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
