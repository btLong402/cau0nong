/**
 * Session Attendance Repository
 * Database access layer for session attendance records
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { SessionAttendance } from "@/lib/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Session Attendance Repository
 */
export class AttendanceRepository extends Repository<SessionAttendance> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "session_attendance", "id");
  }

  /**
   * Find attendance records for a session
   */
  async findBySession(sessionId: number): Promise<SessionAttendance[]> {
    try {
      return await this.find({ session_id: sessionId });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find attendance record for a user in a session
   */
  async findBySessionAndUser(
    sessionId: number,
    userId: string
  ): Promise<SessionAttendance | null> {
    try {
      const records = await this.find({
        session_id: sessionId,
        user_id: userId,
      });
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find all attendance records for a user in a month
   * (Used for calculating monthly statistics)
   */
  async findByUserInMonth(userId: string, monthId: number): Promise<SessionAttendance[]> {
    try {
      // This requires a join, so we fetch from attendance and filter
      const { data, error } = await this.supabase
        .from("session_attendance")
        .select("*, sessions!inner(month_id)")
        .eq("user_id", userId)
        .eq("sessions.month_id", monthId);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Upsert attendance record
   * Creates if doesn't exist, updates if does
   */
  async upsertAttendance(
    sessionId: number,
    userId: string,
    isAttended: boolean
  ): Promise<SessionAttendance> {
    try {
      const existing = await this.findBySessionAndUser(sessionId, userId);

      if (existing) {
        return await this.update(existing.id, { is_attended: isAttended } as any);
      } else {
        return await this.create({
          session_id: sessionId,
          user_id: userId,
          is_attended: isAttended,
          created_at: new Date().toISOString(),
        } as any);
      }
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Bulk upsert attendance records
   */
  async bulkUpsertAttendance(
    sessionId: number,
    records: Array<{ userId: string; isAttended: boolean }>
  ): Promise<SessionAttendance[]> {
    try {
      const results: SessionAttendance[] = [];

      for (const record of records) {
        const result = await this.upsertAttendance(
          sessionId,
          record.userId,
          record.isAttended
        );
        results.push(result);
      }

      return results;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(attendanceId: number): Promise<boolean> {
    try {
      return await this.delete(attendanceId);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Delete all attendance for a session
   */
  async deleteBySession(sessionId: number): Promise<boolean> {
    try {
      const records = await this.findBySession(sessionId);

      for (const record of records) {
        await this.delete(record.id);
      }

      return true;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }
}

/**
 * Create attendance repository with server Supabase client
 */
export async function createAttendanceRepository() {
  const supabase = await createServerSupabaseClient();
  return new AttendanceRepository(supabase);
}
