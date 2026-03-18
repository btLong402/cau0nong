'use client';

import type { Event } from '@/lib/types';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const deficit = Math.max(0, event.total_expense - event.total_support);

  return (
    <div
      onClick={() => onClick(event)}
      className="surface-card p-5 cursor-pointer transition-all duration-200 hover:border-[var(--primary-muted)] hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(event);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[var(--foreground)]">
            {event.event_name}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {new Date(event.event_date).toLocaleDateString('vi-VN', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--info-soft)] px-3 py-2">
          <p className="text-xs text-[var(--info)]">Tổng chi</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {event.total_expense.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="rounded-lg bg-[var(--accent-soft)] px-3 py-2">
          <p className="text-xs text-[var(--accent)]">Tài trợ</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {event.total_support.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="rounded-lg bg-[var(--warning-soft)] px-3 py-2">
          <p className="text-xs text-[var(--warning)]">Cần chia</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {deficit.toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>
    </div>
  );
}
