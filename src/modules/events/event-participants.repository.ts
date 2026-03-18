/**
 * Event Participants Repository
 * Data access layer for event_participants table
 */

import { Repository } from "@/shared/lib/repository";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { EventParticipant } from "@/lib/types";
import type { EventParticipantWithUser } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";

export class EventParticipantsRepository extends Repository<EventParticipant> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "event_participants");
  }

  /**
   * Find participants for an event with user info
   */
  async findByEventWithUsers(
    eventId: number
  ): Promise<EventParticipantWithUser[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        users:user_id (name, email)
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) throw this.mapError(error);

    return (data || []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      contribution_per_person: row.contribution_per_person,
      is_paid: row.is_paid,
      created_at: row.created_at,
      user_name: row.users?.name || "",
      user_email: row.users?.email || "",
    }));
  }

  /**
   * Find participants for an event (plain)
   */
  async findByEvent(eventId: number): Promise<EventParticipant[]> {
    return this.find({ event_id: eventId });
  }

  /**
   * Bulk add participants to event
   */
  async bulkAdd(
    eventId: number,
    userIds: string[]
  ): Promise<EventParticipant[]> {
    const records = userIds.map((userId) => ({
      event_id: eventId,
      user_id: userId,
      contribution_per_person: 0,
      is_paid: false,
    }));

    return this.createMany(records as any);
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(eventId: number, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) throw this.mapError(error);
    return true;
  }

  /**
   * Bulk update contribution_per_person for all participants of an event
   */
  async updateContributions(
    eventId: number,
    amount: number
  ): Promise<EventParticipant[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ contribution_per_person: amount })
      .eq("event_id", eventId)
      .select();

    if (error) throw this.mapError(error);
    return (data || []) as EventParticipant[];
  }

  /**
   * Mark a participant as paid
   */
  async markPaid(eventId: number, userId: string): Promise<EventParticipant> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ is_paid: true })
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw this.mapError(error);
    return data as EventParticipant;
  }

  /**
   * Count participants for an event
   */
  async countByEvent(eventId: number): Promise<number> {
    return this.count({ event_id: eventId });
  }
}

export async function createEventParticipantsRepository(): Promise<EventParticipantsRepository> {
  const supabase = await createServerSupabaseClient();
  return new EventParticipantsRepository(supabase);
}
