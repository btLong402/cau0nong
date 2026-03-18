/**
 * Events Hook
 * Fetches events list and single event detail
 */

import { useFetch } from './useFetch';
import type { Event } from '@/lib/types';
import type { EventWithParticipants, EventListResult } from '@/modules/events/types';

export function useEvents(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const url = `/api/events${queryString ? `?${queryString}` : ''}`;

  return useFetch<EventListResult>(url);
}

export function useEvent(id: number | null) {
  return useFetch<{ event: EventWithParticipants }>(
    id ? `/api/events/${id}` : '',
    { skip: !id },
  );
}
