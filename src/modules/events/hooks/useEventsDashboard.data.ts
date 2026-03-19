"use client";

import { Dispatch, SetStateAction, useCallback, useEffect } from "react";

import type { Event } from "@/lib/types";
import type { EventWithParticipants } from "@/modules/events/types";

import { EventMember } from "./useEventsDashboard";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

interface UseEventsDashboardDataParams {
  setEvents: Dispatch<SetStateAction<Event[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMembers: Dispatch<SetStateAction<EventMember[]>>;
  setSelectedEvent: Dispatch<SetStateAction<EventWithParticipants | null>>;
  setDetailLoading: Dispatch<SetStateAction<boolean>>;
}

export function useEventsDashboardData({
  setEvents,
  setLoading,
  setError,
  setMembers,
  setSelectedEvent,
  setDetailLoading,
}: UseEventsDashboardDataParams) {
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
  }, [setError, setEvents, setLoading]);

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
  }, [setMembers]);

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
  }, [setDetailLoading, setSelectedEvent]);

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, [fetchEvents, fetchMembers]);

  return {
    fetchEvents,
    fetchMembers,
    fetchEventDetail,
  };
}
