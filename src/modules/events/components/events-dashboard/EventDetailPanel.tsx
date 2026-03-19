import type { EventWithParticipants } from "@/modules/events/types";

import { EventParticipantsPanel } from "@/modules/events/components/EventParticipantsPanel";
import { EventSettlementSummary } from "@/modules/events/components/EventSettlementSummary";
import { EventMember } from "@/modules/events/hooks/useEventsDashboard";

interface EventDetailPanelProps {
  selectedEvent: EventWithParticipants | null;
  detailLoading: boolean;
  members: EventMember[];
  onEdit: () => void;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
  onSettle: () => Promise<void>;
  onAddParticipants: (userIds: string[]) => Promise<void>;
  onRemoveParticipant: (userId: string) => Promise<void>;
  onMarkPaid: (userId: string) => Promise<void>;
}

export function EventDetailPanel({
  selectedEvent,
  detailLoading,
  members,
  onEdit,
  onDelete,
  onClose,
  onSettle,
  onAddParticipants,
  onRemoveParticipant,
  onMarkPaid,
}: EventDetailPanelProps) {
  if (!selectedEvent) {
    return null;
  }

  if (detailLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">{selectedEvent.event_name}</h2>
          <p className="text-sm text-[var(--muted)]">
            {new Date(selectedEvent.event_date).toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onEdit} className="btn-secondary text-sm">
            Sửa
          </button>
          <button onClick={() => onDelete(selectedEvent.id)} className="btn-danger text-sm">
            Xóa
          </button>
        </div>
      </div>

      {selectedEvent.participant_count > 0 && (
        <EventSettlementSummary
          event={selectedEvent}
          participantCount={selectedEvent.participant_count}
          contributionPerPerson={selectedEvent.participants[0]?.contribution_per_person || 0}
        />
      )}

      <EventParticipantsPanel
        eventId={selectedEvent.id}
        participants={selectedEvent.participants}
        isSettled={selectedEvent.is_settled}
        onSettleEvent={onSettle}
        onAddParticipants={onAddParticipants}
        onRemoveParticipant={onRemoveParticipant}
        onMarkPaid={onMarkPaid}
        members={members}
      />

      <button onClick={onClose} className="btn-ghost w-full text-sm">
        Đóng chi tiết
      </button>
    </div>
  );
}
