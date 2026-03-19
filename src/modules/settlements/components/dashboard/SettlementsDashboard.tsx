"use client";

import {
  PaymentHistoryPanel,
  PaymentModal,
  SettlementsFilters,
  ShuttlecockManagement,
} from "@/modules/settlements/components";
import {
  formatSettlementCurrency,
  formatSettlementMonthLabel,
  useSettlementsDashboard,
} from "@/modules/settlements/hooks/useSettlementsDashboard";

import {
  DashboardHeader,
  DashboardLoadingState,
  DashboardMonthLoadError,
  DashboardSettlementsPanel,
  DashboardTabs,
} from "./SettlementsDashboard.parts";

export function SettlementsDashboard() {
  const dashboard = useSettlementsDashboard();

  if (dashboard.monthsLoading) {
    return <DashboardLoadingState />;
  }

  if (dashboard.monthsError) {
    return <DashboardMonthLoadError />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        isAdmin={dashboard.authUser?.role === "admin"}
        canGenerate={Boolean(dashboard.activeMonthId)}
        generating={dashboard.generating}
        onGenerate={dashboard.handleGenerate}
      />

      <SettlementsFilters
        months={dashboard.months}
        activeMonthId={dashboard.activeMonthId}
        paymentFilter={dashboard.paymentFilter}
        searchUser={dashboard.searchUser}
        sortBy={dashboard.sortBy}
        sortOrder={dashboard.sortOrder}
        limit={dashboard.limit}
        onMonthChange={dashboard.setSelectedMonthId}
        onPaymentFilterChange={dashboard.setPaymentFilter}
        onSearchChange={dashboard.setSearchUser}
        onSortByChange={dashboard.setSortBy}
        onSortOrderChange={dashboard.setSortOrder}
        onLimitChange={dashboard.setLimit}
        onResetPage={dashboard.resetToFirstPage}
        formatMonthLabel={formatSettlementMonthLabel}
      />

      <DashboardTabs activeTab={dashboard.activeTab} onTabChange={dashboard.setActiveTab} />

      {dashboard.combinedError && (
        <div className="surface-card p-4 border-l-4 border-l-[var(--danger)]">
          <p className="text-sm text-[var(--danger)]">{dashboard.combinedError}</p>
        </div>
      )}

      {dashboard.activeTab === "settlements" ? (
        <DashboardSettlementsPanel
          isAdmin={dashboard.authUser?.role === "admin"}
          generateSummary={dashboard.generateSummary}
          selectedMonth={dashboard.selectedMonth}
          totals={dashboard.totals}
          settlements={dashboard.settlements}
          settlementsLoading={dashboard.settlementsLoading}
          pagination={dashboard.pagination}
          generating={dashboard.generating}
          onGenerate={dashboard.handleGenerate}
          onOpenPayment={dashboard.setSelectedSettlement}
          onSortColumn={dashboard.handleSortColumn}
          renderSortIndicator={dashboard.renderSortIndicator}
          onPrevPage={() => dashboard.setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => dashboard.setPage((prev) => prev + 1)}
        />
      ) : dashboard.activeTab === "shuttlecocks" ? (
        <div className="space-y-6 animate-fade-in">
          <ShuttlecockManagement monthId={dashboard.activeMonthId} formatCurrency={formatSettlementCurrency} />
        </div>
      ) : dashboard.activeTab === "history" ? (
        <div className="animate-fade-in">
          <PaymentHistoryPanel monthId={dashboard.activeMonthId} formatCurrency={formatSettlementCurrency} />
        </div>
      ) : (
        <div className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Tab không hợp lệ</p>
        </div>
      )}

      <PaymentModal
        isOpen={Boolean(dashboard.selectedSettlement)}
        settlement={dashboard.selectedSettlement}
        processing={dashboard.paying}
        onClose={() => dashboard.setSelectedSettlement(null)}
        onConfirm={dashboard.handleConfirmPayment}
        formatCurrency={formatSettlementCurrency}
      />
    </div>
  );
}
