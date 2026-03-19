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
  if (!showForm) {
    return null;
  }

  return (
    <div className="surface-card-soft p-5">
      <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
        {editingEvent ? "Cập nhật sự kiện" : "Tạo sự kiện mới"}
      </h2>
      <EventForm
        initialData={editingEvent || undefined}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isEditing={!!editingEvent}
        loading={loading}
      />
    </div>
  );
}
