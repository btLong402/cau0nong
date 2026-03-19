import type { Event } from "@/lib/types";

import { EventCard } from "@/modules/events/components/EventCard";

interface EventsListPanelProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function EventsListPanel({ events, onEventClick }: EventsListPanelProps) {
  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="empty-state py-12">
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
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
          <p className="empty-state-title">Chưa có sự kiện nào</p>
          <p className="empty-state-text">Nhấn &quot;Tạo sự kiện&quot; để bắt đầu.</p>
        </div>
      ) : (
        events.map((event) => (
          <EventCard key={event.id} event={event} onClick={onEventClick} />
        ))
      )}
    </div>
  );
}
