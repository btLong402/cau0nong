import { CurrentMonthSummary, CurrentSettlement } from "@modules/users/types";
import {
  formatCurrency,
  formatMonth,
} from "@modules/users/lib/my-account-formatters";

interface MyAccountCurrentMonthSummaryProps {
  month: CurrentMonthSummary;
  settlement: CurrentSettlement | null;
}

export function MyAccountCurrentMonthSummary({
  month,
  settlement,
}: MyAccountCurrentMonthSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="stat-card p-3 sm:p-5 text-center">
        <p className="stat-label text-[10px] sm:text-xs">Tháng hiện tại</p>
        <p className="mt-0.5 text-base sm:text-lg font-bold text-[var(--foreground)]">
          {formatMonth(month.month_year)}
        </p>
        <div className="mt-1 flex justify-center">
          <span
            className={`badge text-[10px] sm:text-xs ${month.status === "open" ? "badge-success" : "badge-neutral"}`}
          >
            {month.status === "open" ? "Đang mở" : "Đã đóng"}
          </span>
        </div>
      </div>

      <div className="stat-card p-3 sm:p-5 text-center">
        <p className="stat-label text-[10px] sm:text-xs">Buổi tham gia</p>
        <p className="mt-0.5 text-base sm:text-lg font-bold text-[var(--primary)]">
          {month.sessions_attended} / {month.total_sessions}
        </p>
        <p className="text-[10px] text-[var(--muted)]">buổi</p>
      </div>

      <div className="stat-card p-3 sm:p-5 text-center col-span-2 sm:col-span-1 border-t-2 border-t-[var(--surface-border)] sm:border-t-0">
        <p className="stat-label text-[10px] sm:text-xs">Tiền cần đóng</p>
        <p
          className={`mt-0.5 text-base sm:text-lg font-bold ${settlement?.is_paid ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}
        >
          {settlement ? formatCurrency(settlement.total_due) : "—"}
        </p>
        <div className="mt-1 flex justify-center">
          {settlement && (
            <span
              className={`badge text-[10px] sm:text-xs ${settlement.is_paid ? "badge-success" : "badge-warning"}`}
            >
              {settlement.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
