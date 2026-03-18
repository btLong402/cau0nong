/**
 * Analytics Repository
 * Aggregation queries for dashboard statistics
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttendanceRankItem,
  ExpenseTrendItem,
  OverviewStats,
} from "./types";

export class AnalyticsRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get attendance ranking — users sorted by sessions attended
   */
  async getAttendanceRanking(limit = 20): Promise<AttendanceRankItem[]> {
    const { data, error } = await this.supabase.rpc(
      "get_attendance_ranking",
      { result_limit: limit }
    );

    // If RPC doesn't exist, fallback to manual query
    if (error) {
      return this.getAttendanceRankingFallback(limit);
    }

    return (data || []) as AttendanceRankItem[];
  }

  /**
   * Fallback attendance ranking via direct queries
   */
  private async getAttendanceRankingFallback(
    limit: number
  ): Promise<AttendanceRankItem[]> {
    const { data: attendances, error: attError } = await this.supabase
      .from("session_attendance")
      .select("user_id, is_attended")
      .eq("is_attended", true);

    if (attError || !attendances) return [];

    // Count sessions per user
    const countMap = new Map<string, number>();
    for (const a of attendances) {
      countMap.set(a.user_id, (countMap.get(a.user_id) || 0) + 1);
    }

    // Get user names
    const userIds = Array.from(countMap.keys());
    const { data: users } = await this.supabase
      .from("users")
      .select("id, name")
      .in("id", userIds);

    const userMap = new Map<string, string>();
    for (const u of users || []) {
      userMap.set(u.id, u.name);
    }

    const ranking: AttendanceRankItem[] = Array.from(countMap.entries())
      .map(([userId, count]) => ({
        user_id: userId,
        user_name: userMap.get(userId) || "Unknown",
        sessions_attended: count,
      }))
      .sort((a, b) => b.sessions_attended - a.sessions_attended)
      .slice(0, limit);

    return ranking;
  }

  /**
   * Get expense trend by month (last N months)
   */
  async getExpenseTrend(limit = 12): Promise<ExpenseTrendItem[]> {
    const { data: months, error } = await this.supabase
      .from("months")
      .select("id, month_year, total_shuttlecock_expense")
      .order("month_year", { ascending: false })
      .limit(limit);

    if (error || !months) return [];

    const items: ExpenseTrendItem[] = [];

    for (const month of months) {
      // Sum court expenses for sessions in this month
      const { data: sessions } = await this.supabase
        .from("sessions")
        .select("court_expense_amount")
        .eq("month_id", month.id);

      const courtExpense = (sessions || []).reduce(
        (sum: number, s: any) => sum + Number(s.court_expense_amount || 0),
        0
      );

      const shuttlecockExpense = Number(
        month.total_shuttlecock_expense || 0
      );

      items.push({
        month_year: month.month_year,
        court_expense: Math.round(courtExpense * 100) / 100,
        shuttlecock_expense: Math.round(shuttlecockExpense * 100) / 100,
        total:
          Math.round((courtExpense + shuttlecockExpense) * 100) / 100,
      });
    }

    return items.reverse(); // chronological order
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats(): Promise<OverviewStats> {
    // Active members
    const { count: activeMembers } = await this.supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Total sessions
    const { count: totalSessions } = await this.supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    // Current month expense
    const { data: openMonth } = await this.supabase
      .from("months")
      .select("id, total_shuttlecock_expense")
      .eq("status", "open")
      .order("month_year", { ascending: false })
      .limit(1)
      .single();

    let currentMonthExpense = 0;
    if (openMonth) {
      const { data: sessions } = await this.supabase
        .from("sessions")
        .select("court_expense_amount")
        .eq("month_id", openMonth.id);

      const courtTotal = (sessions || []).reduce(
        (sum: number, s: any) => sum + Number(s.court_expense_amount || 0),
        0
      );
      currentMonthExpense =
        courtTotal + Number(openMonth.total_shuttlecock_expense || 0);
    }

    // Unpaid debt
    const { data: unpaidSettlements } = await this.supabase
      .from("monthly_settlements")
      .select("total_due")
      .eq("is_paid", false);

    const unpaidDebt = (unpaidSettlements || []).reduce(
      (sum: number, s: any) => sum + Number(s.total_due || 0),
      0
    );

    return {
      active_members: activeMembers || 0,
      total_sessions: totalSessions || 0,
      total_expense_current_month:
        Math.round(currentMonthExpense * 100) / 100,
      unpaid_debt: Math.round(unpaidDebt * 100) / 100,
    };
  }
}

export async function createAnalyticsRepository(): Promise<AnalyticsRepository> {
  const supabase = await createServerSupabaseClient();
  return new AnalyticsRepository(supabase);
}
