/**
 * Analytics Module Types
 */

export interface AttendanceRankItem {
  user_id: string;
  user_name: string;
  sessions_attended: number;
}

export interface ExpenseTrendItem {
  month_year: string;
  court_expense: number;
  shuttlecock_expense: number;
  total: number;
}

export interface OverviewStats {
  active_members: number;
  total_sessions: number;
  total_expense_current_month: number;
  unpaid_debt: number;
}

export type AnalyticsType = "overview" | "attendance" | "expense";
