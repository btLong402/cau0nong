'use client';

import type { Event } from '@/lib/types';

interface EventSettlementSummaryProps {
  event: Event;
  participantCount: number;
  contributionPerPerson: number;
}

export function EventSettlementSummary({
  event,
  participantCount,
  contributionPerPerson,
}: EventSettlementSummaryProps) {
  const deficit = Math.max(0, event.total_expense - event.total_support);

  return (
    <div className="surface-card-teal p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        Chia tiền sự kiện
      </h3>

      <div className="mt-3 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Tổng chi phí</span>
          <span className="font-medium text-[var(--foreground)]">
            {event.total_expense.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Tài trợ / Hỗ trợ</span>
          <span className="font-medium text-[var(--accent)]">
            -{event.total_support.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <hr className="border-[var(--surface-border)]" />
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Cần chia</span>
          <span className="font-semibold text-[var(--warning)]">
            {deficit.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Số người tham gia</span>
          <span className="font-medium text-[var(--foreground)]">{participantCount}</span>
        </div>
        <hr className="border-[var(--surface-border)]" />
        <div className="flex justify-between">
          <span className="font-semibold text-[var(--foreground)]">Mỗi người đóng</span>
          <span className="text-lg font-bold text-[var(--primary)]">
            {contributionPerPerson.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>
    </div>
  );
}
