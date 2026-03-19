import {
  SettlementsOverviewCards,
  SettlementsTable,
} from "@/modules/settlements/components";
import {
  formatSettlementCurrency,
  formatSettlementMonthLabel,
} from "@/modules/settlements/hooks/useSettlementsDashboard";
import { GenerateSummary, SettlementListItem } from "@/shared/hooks";

export type DashboardTab = "settlements" | "history" | "shuttlecocks";

interface DashboardHeaderProps {
  isAdmin: boolean;
  canGenerate: boolean;
  generating: boolean;
  onGenerate: (force?: boolean) => void;
}

export function DashboardLoadingState() {
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

export function DashboardMonthLoadError() {
  return (
    <div className="surface-card p-4 border-l-4 border-l-[var(--danger)]">
      <p className="text-sm text-[var(--danger)]">Không thể tải danh sách kỳ quản lý.</p>
    </div>
  );
}

export function DashboardHeader({ isAdmin, canGenerate, generating, onGenerate }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="page-title">Quyết toán tháng</h1>
        <p className="page-subtitle">
          Quản lý tổng công nợ, tạo VietQR, xác nhận thanh toán và theo dõi lịch sử giao dịch.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onGenerate(false)}
              disabled={!canGenerate || generating}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Đang tạo..." : "Tạo quyết toán"}
            </button>
            <button
              type="button"
              onClick={() => onGenerate(true)}
              disabled={!canGenerate || generating}
              className="btn-primary bg-[var(--warning)] hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Đang xử lý..." : "Tạo lại (force)"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const tabs: Array<{ value: DashboardTab; label: string }> = [
    { value: "settlements", label: "Quyết toán tháng" },
    { value: "history", label: "Lịch sử giao dịch" },
    { value: "shuttlecocks", label: "Chi phí mua cầu" },
  ];

  return (
    <div className="flex border-b border-[var(--surface-border)]">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === tab.value
              ? "text-[var(--primary)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab.label}
          {activeTab === tab.value && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
          )}
        </button>
      ))}
    </div>
  );
}

interface DashboardSettlementsPanelProps {
  isAdmin: boolean;
  generateSummary: GenerateSummary | null;
  selectedMonth: { month_year: string } | null;
  totals: { totalDue: number; paidCount: number; unpaidCount: number };
  settlements: SettlementListItem[];
  settlementsLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  generating: boolean;
  onGenerate: (force?: boolean) => void;
  onOpenPayment: (item: SettlementListItem) => void;
  onSortColumn: (field: "total_due" | "created_at" | "paid_at" | "user_id") => void;
  renderSortIndicator: (field: "total_due" | "created_at" | "paid_at" | "user_id") => string;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function DashboardSettlementsPanel({
  isAdmin,
  generateSummary,
  selectedMonth,
  totals,
  settlements,
  settlementsLoading,
  pagination,
  generating,
  onGenerate,
  onOpenPayment,
  onSortColumn,
  renderSortIndicator,
  onPrevPage,
  onNextPage,
}: DashboardSettlementsPanelProps) {
  return (
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
          <p className="empty-state-text">Dữ liệu quyết toán cho tháng này chưa được khởi tạo.</p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onGenerate(false)}
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
          onOpenPayment={onOpenPayment}
          onSortColumn={onSortColumn}
          renderSortIndicator={renderSortIndicator}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          formatCurrency={formatSettlementCurrency}
        />
      )}
    </div>
  );
}
