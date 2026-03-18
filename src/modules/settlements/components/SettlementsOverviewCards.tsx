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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <article className="surface-card-soft p-5">
        <p className="text-sm text-slate-600">Tổng cần thu</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalDue)}</p>
      </article>
      <article className="surface-card-soft p-5">
        <p className="text-sm text-slate-600">Đã thanh toán</p>
        <p className="mt-2 text-2xl font-semibold text-emerald-700">{paidCount}</p>
      </article>
      <article className="surface-card-soft p-5">
        <p className="text-sm text-slate-600">Chưa thanh toán</p>
        <p className="mt-2 text-2xl font-semibold text-amber-700">{unpaidCount}</p>
      </article>
    </div>
  );
}
