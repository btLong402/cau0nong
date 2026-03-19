"use client";

import {
  PaymentHistoryPanel,
  PaymentModal,
  SettlementsFilters,
  SettlementsOverviewCards,
  SettlementsTable,
  ShuttlecockManagement,
} from "@/modules/settlements/components";
import {
  formatSettlementCurrency,
  formatSettlementMonthLabel,
  useSettlementsDashboard,
} from "@/modules/settlements/hooks/useSettlementsDashboard";

export function SettlementsDashboard() {
  const {
    authUser,
    months,
    monthsLoading,
    monthsError,
    settlements,
    settlementsLoading,
    pagination,
    activeMonthId,
    selectedMonth,
    paymentFilter,
    searchUser,
    limit,
    sortBy,
    sortOrder,
    selectedSettlement,
    activeTab,
    generating,
    generateSummary,
    paying,
    totals,
    combinedError,
    setSelectedMonthId,
    setPaymentFilter,
    setSearchUser,
    setPage,
    setLimit,
    setSortBy,
    setSortOrder,
    setSelectedSettlement,
    setActiveTab,
    resetToFirstPage,
    handleSortColumn,
    renderSortIndicator,
    handleGenerate,
    handleConfirmPayment,
  } = useSettlementsDashboard();

  if (monthsLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="skeleton h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (monthsError) {
    return (
      <div className="surface-card p-4 border-l-4 border-l-[var(--danger)]">
        <p className="text-sm text-[var(--danger)]">Không thể tải danh sách kỳ quản lý.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Quyết toán tháng</h1>
          <p className="page-subtitle">
            Quản lý tổng công nợ, tạo VietQR, xác nhận thanh toán và theo dõi lịch sử giao dịch.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {authUser?.role === "admin" && (
            <>
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={!activeMonthId || generating}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Đang tạo..." : "Tạo quyết toán"}
              </button>
              <button
                type="button"
                onClick={() => handleGenerate(true)}
                disabled={!activeMonthId || generating}
                className="btn-primary bg-[var(--warning)] hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Đang xử lý..." : "Tạo lại (force)"}
              </button>
            </>
          )}
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
        formatMonthLabel={formatSettlementMonthLabel}
      />

      <div className="flex border-b border-[var(--surface-border)]">
        <button
          onClick={() => setActiveTab("settlements")}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === "settlements"
              ? "text-[var(--primary)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Quyết toán tháng
          {activeTab === "settlements" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === "history"
              ? "text-[var(--primary)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Lịch sử giao dịch
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("shuttlecocks")}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === "shuttlecocks"
              ? "text-[var(--primary)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Chi phí mua cầu
          {activeTab === "shuttlecocks" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
          )}
        </button>
      </div>

      {combinedError && (
        <div className="surface-card p-4 border-l-4 border-l-[var(--danger)]">
          <p className="text-sm text-[var(--danger)]">{combinedError}</p>
        </div>
      )}

      {activeTab === "settlements" ? (
        <div className="space-y-6 animate-fade-in">
          {generateSummary && (
            <div className="surface-card p-4 border-l-4 border-l-[var(--primary)]">
              <p className="text-sm text-[var(--primary)]">
                Hoàn tất tạo quyết toán cho{" "}
                {selectedMonth
                  ? formatSettlementMonthLabel(selectedMonth.month_year)
                  : `tháng ${generateSummary.monthId}`}
                : {generateSummary.generatedCount} dòng, tổng cần thu{" "}
                {formatSettlementCurrency(generateSummary.totalDue)}.
              </p>
            </div>
          )}

          <SettlementsOverviewCards
            totalDue={totals.totalDue}
            paidCount={totals.paidCount}
            unpaidCount={totals.unpaidCount}
            formatCurrency={formatSettlementCurrency}
          />

          {settlements.length === 0 && !settlementsLoading ? (
            <div className="surface-card empty-state">
              <svg
                className="empty-state-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="empty-state-title">Chưa có dữ liệu quyết toán</p>
              <p className="empty-state-text">
                Dữ liệu quyết toán cho tháng này chưa được khởi tạo.
              </p>
              {authUser?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  disabled={generating}
                  className="btn-primary mt-4"
                >
                  {generating ? "Đang tạo..." : "Tạo quyết toán ngay"}
                </button>
              )}
            </div>
          ) : (
            <SettlementsTable
              settlements={settlements}
              loading={settlementsLoading}
              pagination={pagination}
              monthLabel={selectedMonth ? `- ${formatSettlementMonthLabel(selectedMonth.month_year)}` : ""}
              onOpenPayment={setSelectedSettlement}
              onSortColumn={handleSortColumn}
              renderSortIndicator={renderSortIndicator}
              onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
              onNextPage={() => setPage((prev) => prev + 1)}
              formatCurrency={formatSettlementCurrency}
            />
          )}
        </div>
      ) : activeTab === "shuttlecocks" ? (
        <div className="space-y-6 animate-fade-in">
          <ShuttlecockManagement monthId={activeMonthId} formatCurrency={formatSettlementCurrency} />
        </div>
      ) : activeTab === "history" ? (
        <div className="animate-fade-in">
          <PaymentHistoryPanel monthId={activeMonthId} formatCurrency={formatSettlementCurrency} />
        </div>
      ) : (
        <div className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Tab không hợp lệ</p>
        </div>
      )}

      <PaymentModal
        isOpen={Boolean(selectedSettlement)}
        settlement={selectedSettlement}
        processing={paying}
        onClose={() => setSelectedSettlement(null)}
        onConfirm={handleConfirmPayment}
        formatCurrency={formatSettlementCurrency}
      />
    </div>
  );
}
