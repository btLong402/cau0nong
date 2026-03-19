"use client";

import { useCallback, useEffect, useState } from "react";

import type { Event } from "@/lib/types";
import type { EventWithParticipants } from "@/modules/events/types";

export interface EventMember {
  id: string;
  name: string;
  email: string;
}

export interface EventFormData {
  event_name: string;
  event_date: string;
  total_support: number;
  total_expense: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useEventsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithParticipants | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      setEvents(payload.data?.items || []);
      setError(null);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError, "Lỗi tải dữ liệu"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setMembers(payload.data?.users || []);
    } catch {
      // Non-critical for events overview.
    }
  }, []);

  const fetchEventDetail = useCallback(async (eventId: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      setSelectedEvent(payload.data?.event || null);
    } catch {
      setSelectedEvent(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, [fetchEvents, fetchMembers]);

  const openCreateForm = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const openEditForm = () => {
    if (!selectedEvent) {
      return;
    }

    setEditingEvent(selectedEvent);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const closeDetail = () => {
    setSelectedEvent(null);
  };

  const handleCardClick = (event: Event) => {
    fetchEventDetail(event.id);
  };

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
    events,
    loading,
    error,
    showForm,
    editingEvent,
    selectedEvent,
    detailLoading,
    members,
    formLoading,
    fetchEvents,
    openCreateForm,
    openEditForm,
    closeForm,
    closeDetail,
    handleCardClick,
    submitEventForm,
    deleteEvent,
    settleSelectedEvent,
    addParticipants,
    removeParticipant,
    markParticipantPaid,
  };
}
