import type { Event } from "@/lib/types";
import type { EventWithParticipants } from "@/modules/events/types";

import { EventFormData } from "./useEventsDashboard";
import { useEventParticipantActions } from "./useEventsDashboard.participantActions";

interface UseEventsDashboardActionsParams {
  editingEvent: Event | null;
  selectedEvent: EventWithParticipants | null;
  setFormLoading: (value: boolean) => void;
  setSelectedEvent: (value: EventWithParticipants | null) => void;
  closeForm: () => void;
  fetchEvents: () => Promise<void>;
  fetchEventDetail: (eventId: number) => Promise<void>;
}

export function useEventsDashboardActions({
  editingEvent,
  selectedEvent,
  setFormLoading,
  setSelectedEvent,
  closeForm,
  fetchEvents,
  fetchEventDetail,
}: UseEventsDashboardActionsParams) {
  const {
    settleSelectedEvent,
    addParticipants,
    removeParticipant,
    markParticipantPaid,
  } = useEventParticipantActions({
    selectedEvent,
    fetchEventDetail,
  });

  const submitEventForm = async (formData: EventFormData) => {
    setFormLoading(true);
    try {
      const method = editingEvent ? "PUT" : "POST";
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error?.message || `HTTP ${response.status}`);
      }

      closeForm();
      await fetchEvents();

      if (selectedEvent) {
        await fetchEventDetail(selectedEvent.id);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const deleteEvent = async (eventId: number) => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const payload = response.ok
        ? await response.json()
        : { error: { message: "Không thể xóa" } };
      alert(payload.error?.message || "Không thể xóa");
      return;
    }

    setSelectedEvent(null);
    await fetchEvents();
  };

  return {
    submitEventForm,
    deleteEvent,
    settleSelectedEvent,
    addParticipants,
    removeParticipant,
    markParticipantPaid,
  };
}
