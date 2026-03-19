"use client";

import { useState } from "react";

import type { Event } from "@/lib/types";
import type { EventWithParticipants } from "@/modules/events/types";
import { useEventsDashboardActions } from "@/modules/events/hooks/useEventsDashboard.actions";
import { useEventsDashboardData } from "@/modules/events/hooks/useEventsDashboard.data";

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

  const { fetchEvents, fetchEventDetail } = useEventsDashboardData({
    setEvents,
    setLoading,
    setError,
    setMembers,
    setSelectedEvent,
    setDetailLoading,
  });

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

  const {
    submitEventForm,
    deleteEvent,
    settleSelectedEvent,
    addParticipants,
    removeParticipant,
    markParticipantPaid,
  } = useEventsDashboardActions({
    editingEvent,
    selectedEvent,
    setFormLoading,
    setSelectedEvent,
    closeForm,
    fetchEvents,
    fetchEventDetail,
  });

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
