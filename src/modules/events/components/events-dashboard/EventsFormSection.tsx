import type { Event } from "@/lib/types";

import { EventForm } from "@/modules/events/components/EventForm";
import { EventFormData } from "@/modules/events/hooks/useEventsDashboard";

interface EventsFormSectionProps {
  showForm: boolean;
  editingEvent: Event | null;
  loading: boolean;
  onSubmit: (formData: EventFormData) => Promise<void>;
  onCancel: () => void;
}

export function EventsFormSection({
  showForm,
  editingEvent,
  loading,
  onSubmit,
  onCancel,
}: EventsFormSectionProps) {
  const initialData = editingEvent
    ? {
        event_name: editingEvent.event_name,
        event_date: editingEvent.event_date,
        total_support: editingEvent.total_support,
        total_expense: editingEvent.total_expense,
        month_id: editingEvent.month_id ?? undefined,
      }
    : undefined;

  if (!showForm) {
    return null;
  }

  return (
    <div className="surface-card-soft p-5">
      <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
        {editingEvent ? "Cập nhật sự kiện" : "Tạo sự kiện mới"}
      </h2>
      <EventForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isEditing={!!editingEvent}
        loading={loading}
      />
    </div>
  );
}
