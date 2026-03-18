/**
 * Events Repository
 * Data access layer for events table
 */

import { Repository } from "@/shared/lib/repository";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import { EVENT_DEFAULTS } from "./constants";
import { SupabaseClient } from "@supabase/supabase-js";

export class EventsRepository extends Repository<Event> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "events");
  }

  /**
   * Find events with pagination and search
   */
  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<{ items: Event[]; total: number }> {
    const { page, limit, search, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.supabase.from(this.tableName).select("*", {
      count: "exact",
    });

    if (search?.trim()) {
      query = query.ilike("event_name", `%${search.trim()}%`);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw this.mapError(error);

    return {
      items: (data || []) as Event[],
      total: count || 0,
    };
  }

  /**
   * Find event by ID
   */
  async findEventById(id: number): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw this.mapError(error);
    }

    return data as Event;
  }

  /**
   * Create event
   */
  async createEvent(data: {
    event_name: string;
    event_date: string;
    total_support: number;
    total_expense: number;
    month_id?: number | null;
  }): Promise<Event> {
    return this.create(data as any);
  }

  /**
   * Update event
   */
  async updateEvent(
    id: number,
    data: Partial<{
      event_name: string;
      event_date: string;
      total_support: number;
      total_expense: number;
      month_id: number | null;
    }>
  ): Promise<Event> {
    return this.update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    } as any);
  }

  /**
   * Delete event
   */
  async deleteEvent(id: number): Promise<boolean> {
    return this.delete(id);
  }
}

export async function createEventsRepository(): Promise<EventsRepository> {
  const supabase = await createServerSupabaseClient();
  return new EventsRepository(supabase);
}
