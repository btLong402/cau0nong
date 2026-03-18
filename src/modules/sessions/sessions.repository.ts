/**
 * Sessions Repository
 * Database access layer for badminton sessions
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { Session } from "@/lib/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sessions Repository
 */
export class SessionsRepository extends Repository<Session> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "sessions", "id");
  }

  /**
   * Find sessions by month
   */
  async findByMonth(monthId: number): Promise<Session[]> {
    try {
      return await this.find({ month_id: monthId });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find sessions by date range (within a month)
   */
  async findByMonthSorted(monthId: number): Promise<Session[]> {
    try {
      const sessions = await this.findByMonth(monthId);
      return sessions.sort(
        (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find session by date and month
   */
  async findByDate(monthId: number, date: string): Promise<Session | null> {
    try {
      const sessions = await this.find({ month_id: monthId, session_date: date });
      return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: number,
    data: Partial<Session>
  ): Promise<Session> {
    try {
      return await this.update(sessionId, data as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Delete session (cascade deletes attendance records via DB trigger)
   */
  async deleteSession(sessionId: number): Promise<boolean> {
    try {
      return await this.delete(sessionId);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }
}

/**
 * Create sessions repository with server Supabase client
 */
export async function createSessionsRepository() {
  const supabase = await createServerSupabaseClient();
  return new SessionsRepository(supabase);
}
