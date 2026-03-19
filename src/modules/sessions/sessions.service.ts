/**
 * Sessions Service
 * Business logic for session and attendance management
 */

import { Session, SessionAttendance } from "@/lib/types";
import { SessionsRepository, createSessionsRepository } from "./sessions.repository";
import { AttendanceRepository, createAttendanceRepository } from "./attendance.repository";
import { NotFoundError } from "@/shared/api";

export interface CreateSessionData {
  month_id: number;
  session_date: string; // YYYY-MM-DD
  court_expense_amount: number;
  payer_user_id: string;
  notes?: string;
}

export interface UpdateSessionData {
  session_date?: string;
  court_expense_amount?: number;
  payer_user_id?: string;
  notes?: string;
  status?: "open" | "closed";
}

/**
 * Sessions Service
 */
export class SessionsService {
  constructor(
    private sessionsRepo: SessionsRepository,
    private attendanceRepo: AttendanceRepository
  ) {}

  /**
   * Create new session
   */
  async createSession(data: CreateSessionData): Promise<Session> {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.session_date)) {
      throw new Error("session_date phải có định dạng YYYY-MM-DD");
    }

    // Validate court expense
    if (data.court_expense_amount <= 0) {
      throw new Error("court_expense_amount phải lớn hơn 0");
    }

    return await this.sessionsRepo.create({
      month_id: data.month_id,
      session_date: data.session_date,
      court_expense_amount: data.court_expense_amount,
      payer_user_id: data.payer_user_id,
      notes: data.notes,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: number): Promise<Session> {
    const session = await this.sessionsRepo.findById(sessionId);

    if (!session) {
      throw new NotFoundError("buổi tập");
    }

    return session;
  }

  /**
   * Get sessions for a month
   */
  async listSessionsByMonth(monthId: number): Promise<Session[]> {
    return await this.sessionsRepo.findByMonthSorted(monthId);
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: number,
    data: UpdateSessionData
  ): Promise<Session> {
    const session = await this.getSession(sessionId);

    if (data.court_expense_amount && data.court_expense_amount <= 0) {
      throw new Error("court_expense_amount phải lớn hơn 0");
    }

    return await this.sessionsRepo.updateSession(sessionId, {
      session_date: data.session_date || session.session_date,
      court_expense_amount: data.court_expense_amount || session.court_expense_amount,
      payer_user_id: data.payer_user_id || session.payer_user_id,
      notes: data.notes !== undefined ? data.notes : session.notes,
      status: data.status || session.status,
      updated_at: new Date().toISOString(),
    } as any);
  }

  /**
   * Delete session (cascade deletes attendance)
   */
  async deleteSession(sessionId: number): Promise<boolean> {
    await this.getSession(sessionId);
    return await this.sessionsRepo.deleteSession(sessionId);
  }

  /**
   * Record attendance for a session
   */
  async recordAttendance(
    sessionId: number,
    records: Array<{ userId: string; isAttended: boolean }>
  ): Promise<SessionAttendance[]> {
    // Verify session exists
    await this.getSession(sessionId);

    return await this.attendanceRepo.bulkUpsertAttendance(sessionId, records);
  }

  /**
   * Get attendance for a session
   */
  async getSessionAttendance(sessionId: number): Promise<SessionAttendance[]> {
    await this.getSession(sessionId);
    return await this.attendanceRepo.findBySession(sessionId);
  }

  /**
   * Get attendance for a user in a month
   * (Used for calculating monthly participation)
   */
  async getUserMonthlyAttendance(
    userId: string,
    monthId: number
  ): Promise<SessionAttendance[]> {
    return await this.attendanceRepo.findByUserInMonth(userId, monthId);
  }

  /**
   * Get count of members who attended a session
   */
  async getSessionAttendanceCount(sessionId: number): Promise<number> {
    const records = await this.attendanceRepo.findBySession(sessionId);
    return records.filter((r) => r.is_attended).length;
  }

  /**
   * Get count of sessions attended by user in a month
   */
  async getUserAttendanceCountInMonth(
    userId: string,
    monthId: number
  ): Promise<number> {
    const records = await this.getUserMonthlyAttendance(userId, monthId);
    return records.filter((r) => r.is_attended).length;
  }
}

/**
 * Create sessions service with injected repositories
 */
export async function createSessionsService() {
  const sessionsRepo = await createSessionsRepository();
  const attendanceRepo = await createAttendanceRepository();
  return new SessionsService(sessionsRepo, attendanceRepo);
}
