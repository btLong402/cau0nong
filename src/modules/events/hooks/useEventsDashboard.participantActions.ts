import type { EventWithParticipants } from "@/modules/events/types";

interface UseEventParticipantActionsParams {
  selectedEvent: EventWithParticipants | null;
  fetchEventDetail: (eventId: number) => Promise<void>;
}

export function useEventParticipantActions({
  selectedEvent,
  fetchEventDetail,
}: UseEventParticipantActionsParams) {
  const settleSelectedEvent = async () => {
    if (!selectedEvent) {
      return;
    }

    const response = await fetch(`/api/events/${selectedEvent.id}/settle`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const payload = await response.json();
      alert(payload.error?.message || "Lỗi tính tiền");
      return;
    }

    await fetchEventDetail(selectedEvent.id);
  };

  const addParticipants = async (userIds: string[]) => {
    if (!selectedEvent) {
      return;
    }

    const response = await fetch(`/api/events/${selectedEvent.id}/participants`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });

    if (!response.ok) {
      const payload = await response.json();
      alert(payload.error?.message || "Lỗi thêm người");
      return;
    }

    await fetchEventDetail(selectedEvent.id);
  };

  const removeParticipant = async (userId: string) => {
    if (!selectedEvent) {
      return;
    }

    const response = await fetch(`/api/events/${selectedEvent.id}/participants/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const payload = await response.json();
      alert(payload.error?.message || "Lỗi xóa người");
      return;
    }

    await fetchEventDetail(selectedEvent.id);
  };

  const markParticipantPaid = async (userId: string) => {
    if (!selectedEvent) {
      return;
    }

    const response = await fetch(`/api/events/${selectedEvent.id}/participants/${userId}`, {
      method: "PUT",
      credentials: "include",
    });

    if (!response.ok) {
      const payload = await response.json();
      alert(payload.error?.message || "Lỗi xác nhận");
      return;
    }

    await fetchEventDetail(selectedEvent.id);
  };

  return {
    settleSelectedEvent,
    addParticipants,
    removeParticipant,
    markParticipantPaid,
  };
}
