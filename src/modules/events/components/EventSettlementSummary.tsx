/**
 * EventSettlementSummary Component
 * Shows breakdown: total expense - total support = deficit / participants
 */

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
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        Chia tiền sự kiện
      </h3>

      <div className="mt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Tổng chi phí</span>
          <span className="font-medium text-slate-900">
            {event.total_expense.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Tài trợ / Hỗ trợ</span>
          <span className="font-medium text-green-700">
            -{event.total_support.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <hr className="border-slate-200" />
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Cần chia</span>
          <span className="font-semibold text-amber-700">
            {deficit.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Số người tham gia</span>
          <span className="font-medium text-slate-900">{participantCount}</span>
        </div>
        <hr className="border-slate-200" />
        <div className="flex justify-between">
          <span className="font-semibold text-slate-900">Mỗi người đóng</span>
          <span className="text-lg font-bold text-blue-700">
            {contributionPerPerson.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>
    </div>
  );
}
