'use client';

interface SettlementsOverviewCardsProps {
  totalDue: number;
  paidCount: number;
  unpaidCount: number;
  formatCurrency: (value: number) => string;
}

export function SettlementsOverviewCards({
  totalDue,
  paidCount,
  unpaidCount,
  formatCurrency,
}: SettlementsOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="stat-card">
        <p className="stat-label">Tổng cần thu</p>
        <p className="stat-value">{formatCurrency(totalDue)}</p>
      </div>
      <div className="stat-card">
        <p className="stat-label">Đã thanh toán</p>
        <p className="stat-value text-[var(--accent)]">{paidCount}</p>
      </div>
      <div className="stat-card">
        <p className="stat-label">Chưa thanh toán</p>
        <p className="stat-value text-[var(--warning)]">{unpaidCount}</p>
      </div>
    </div>
  );
}
