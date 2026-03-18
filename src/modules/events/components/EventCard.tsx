/**
 * EventCard Component
 * Displays a single event in the list view
 */

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
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(event);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {event.event_name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
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
        <div className="rounded-lg bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-600">Tong chi</p>
          <p className="text-sm font-semibold text-blue-900">
            {event.total_expense.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="rounded-lg bg-green-50 px-3 py-2">
          <p className="text-xs text-green-600">Tai tro</p>
          <p className="text-sm font-semibold text-green-900">
            {event.total_support.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-600">Can chia</p>
          <p className="text-sm font-semibold text-amber-900">
            {deficit.toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>
    </div>
  );
}
