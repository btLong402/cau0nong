import { PaymentHistoryItem } from "@modules/users/types";
import {
  formatCurrency,
  formatMonth,
} from "@modules/users/lib/my-account-formatters";

interface MyAccountPaymentHistoryProps {
  paymentHistory: PaymentHistoryItem[];
}

export function MyAccountPaymentHistory({
  paymentHistory,
}: MyAccountPaymentHistoryProps) {
  if (paymentHistory.length === 0) {
    return null;
  }

  return (
    <div className="surface-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
        Lịch sử thanh toán
      </h2>

      <div className="overflow-x-auto hidden sm:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tháng</th>
              <th className="text-right">Tiền sân</th>
              <th className="text-right">Tiền cầu</th>
              <th className="text-right">Tổng</th>
              <th className="text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((item) => (
              <tr key={item.month_year}>
                <td className="font-medium">{formatMonth(item.month_year)}</td>
                <td className="text-right text-[var(--muted)]">{formatCurrency(item.court_fee)}</td>
                <td className="text-right text-[var(--muted)]">
                  {formatCurrency(item.shuttlecock_fee)}
                </td>
                <td className="text-right font-semibold">{formatCurrency(item.total_due)}</td>
                <td className="text-center">
                  <span className={`badge ${item.is_paid ? "badge-success" : "badge-warning"}`}>
                    {item.is_paid ? "Đã đóng" : "Chưa đóng"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-list sm:hidden">
        {paymentHistory.map((item) => (
          <div key={item.month_year} className="card-list-item">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {formatMonth(item.month_year)}
              </p>
              <span className={`badge ${item.is_paid ? "badge-success" : "badge-warning"}`}>
                {item.is_paid ? "Đã đóng" : "Chưa đóng"}
              </span>
            </div>
            <p className="text-lg font-bold text-[var(--foreground)]">
              {formatCurrency(item.total_due)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
