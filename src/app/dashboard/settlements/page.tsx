'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SettlementListItem,
  useDebouncedValue,
  useGenerateMonthSettlements,
  useMarkSettlementPaid,
  useMonthSettlements,
  useMonths,
} from '@/shared/hooks';
import {
  PaymentHistoryPanel,
  PaymentModal,
  SettlementsFilters,
  SettlementsOverviewCards,
  SettlementsTable,
} from '@/modules/settlements/components';

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

  const searchParams = useSearchParams();
  const monthIdParam = searchParams.get('monthId');

  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(
    monthIdParam ? parseInt(monthIdParam, 10) : null
  );
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchUser, setSearchUser] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<'total_due' | 'created_at' | 'paid_at' | 'user_id'>('total_due');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementListItem | null>(null);

  const debouncedSearchUser = useDebouncedValue(searchUser, 350);

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
      const message = error instanceof Error ? error.message : 'Không thể tạo dữ liệu quyết toán';
      setPageError(message);
    }
  }

  async function handleConfirmPayment(item: SettlementListItem) {
    setPageError(null);

    await markPaid(item.id, item.total_due);
    await refetch();
  }

  // Handle URL change when user navigates with a different monthId
  useEffect(() => {
    if (monthIdParam) {
      const id = parseInt(monthIdParam, 10);
      if (!isNaN(id) && id !== selectedMonthId) {
        setSelectedMonthId(id);
      }
    }
  }, [monthIdParam]);

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

  const combinedError =
    pageError || settlementsError?.message || generateError?.message || payError?.message || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Quyết toán tháng</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý tổng công nợ, tạo VietQR, xác nhận thanh toán và theo dõi lịch sử giao dịch.
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

      <SettlementsFilters
        months={months}
        activeMonthId={activeMonthId}
        paymentFilter={paymentFilter}
        searchUser={searchUser}
        sortBy={sortBy}
        sortOrder={sortOrder}
        limit={limit}
        onMonthChange={setSelectedMonthId}
        onPaymentFilterChange={setPaymentFilter}
        onSearchChange={setSearchUser}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onLimitChange={setLimit}
        onResetPage={resetToFirstPage}
        formatMonthLabel={formatMonthLabel}
      />

      {combinedError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {combinedError}
        </div>
      )}

      {generateSummary && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Hoàn tất tạo quyết toán cho {selectedMonth ? formatMonthLabel(selectedMonth.month_year) : `tháng ${generateSummary.monthId}`}: {generateSummary.generatedCount} dòng,
          tổng cần thu {formatCurrency(generateSummary.totalDue)}.
        </div>
      )}

      <SettlementsOverviewCards
        totalDue={totals.totalDue}
        paidCount={totals.paidCount}
        unpaidCount={totals.unpaidCount}
        formatCurrency={formatCurrency}
      />

      {settlements.length === 0 && !settlementsLoading && (
        <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900">Chưa có dữ liệu quyết toán</h3>
          <p className="mb-6 mt-1 max-w-xs text-sm text-slate-600">
            Dữ liệu quyết toán cho tháng này chưa được khởi tạo. Nhấn nút bên dưới để hệ thống tự động tính toán.
          </p>
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? 'Đang tạo...' : 'Tạo quyết toán ngay'}
          </button>
        </div>
      )}

      {settlements.length > 0 && (
        <SettlementsTable
          settlements={settlements}
          loading={settlementsLoading}
          pagination={pagination}
          monthLabel={selectedMonth ? `- ${formatMonthLabel(selectedMonth.month_year)}` : ''}
          onOpenPayment={setSelectedSettlement}
          onSortColumn={handleSortColumn}
          renderSortIndicator={renderSortIndicator}
          onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => prev + 1)}
          formatCurrency={formatCurrency}
        />
      )}

      <PaymentHistoryPanel monthId={activeMonthId} formatCurrency={formatCurrency} />

      <PaymentModal
        isOpen={Boolean(selectedSettlement)}
        settlement={selectedSettlement}
        processing={paying}
        onClose={() => setSelectedSettlement(null)}
        onConfirm={handleConfirmPayment}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
