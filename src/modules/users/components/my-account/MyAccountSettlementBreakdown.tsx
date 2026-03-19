import { CurrentSettlement } from "@modules/users/types";
import { formatCurrency } from "@modules/users/lib/my-account-formatters";

interface MyAccountSettlementBreakdownProps {
  settlement: CurrentSettlement;
}

export function MyAccountSettlementBreakdown({
  settlement,
}: MyAccountSettlementBreakdownProps) {
  return (
    <div className="surface-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
        Chi tiết công nợ tháng này
      </h2>

      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Tiền sân</span>
          <span className="font-medium">{formatCurrency(settlement.court_fee)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Tiền cầu</span>
          <span className="font-medium">{formatCurrency(settlement.shuttlecock_fee)}</span>
        </div>

        {settlement.past_debt > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--danger)]">Nợ tồn đọng</span>
            <span className="font-medium text-[var(--danger)]">
              +{formatCurrency(settlement.past_debt)}
            </span>
          </div>
        )}

        {settlement.event_debt > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--warning)]">Tiền sự kiện</span>
            <span className="font-medium text-[var(--warning)]">
              +{formatCurrency(settlement.event_debt)}
            </span>
          </div>
        )}

        {settlement.balance_carried > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--accent)]">Tiền thừa tháng trước</span>
            <span className="font-medium text-[var(--accent)]">
              -{formatCurrency(settlement.balance_carried)}
            </span>
          </div>
        )}

        {settlement.court_payer_offset > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--accent)]">Đã ứng tiền sân</span>
            <span className="font-medium text-[var(--accent)]">
              -{formatCurrency(settlement.court_payer_offset)}
            </span>
          </div>
        )}

        {settlement.shuttlecock_buyer_offset > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--accent)]">Đã ứng tiền cầu</span>
            <span className="font-medium text-[var(--accent)]">
              -{formatCurrency(settlement.shuttlecock_buyer_offset)}
            </span>
          </div>
        )}

        <div className="border-t border-[var(--surface-border)] pt-2.5 mt-2.5 flex justify-between text-sm font-bold">
          <span className="text-[var(--foreground)]">Tổng cần thanh toán</span>
          <span className={settlement.is_paid ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
            {formatCurrency(settlement.total_due)}
          </span>
        </div>
      </div>
    </div>
  );
}
