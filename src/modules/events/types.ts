/**
 * Events Module Types
 * Domain types for event management
 */

import type { Event, EventParticipant } from "@/lib/types";

// Re-export core types
export type { Event, EventParticipant };

// Input types
export interface CreateEventData {
  event_name: string;
  event_date: string; // YYYY-MM-DD
  total_support: number;
  total_expense: number;
  month_id?: number | null;
}

export interface UpdateEventData {
  event_name?: string;
  event_date?: string;
  total_support?: number;
  total_expense?: number;
  month_id?: number | null;
}

// Composite types
export interface EventWithParticipants extends Event {
  participants: EventParticipantWithUser[];
  participant_count: number;
  is_settled: boolean;
}

export interface EventParticipantWithUser extends EventParticipant {
  user_name: string;
  user_email: string;
}

// List/filter types
export interface EventListFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "event_date" | "created_at" | "event_name";
  sortOrder?: "asc" | "desc";
}

export interface EventListResult {
  items: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
