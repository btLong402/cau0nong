/**
 * Core Types for CLB Cau Long Management System
 */

// User & Auth
export type UserRole = "admin" | "member";
export type UserApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string; // UUID from Supabase Auth
  name: string;
  username: string;
  phone: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  balance: number;
  is_active: boolean;
  approval_status: UserApprovalStatus;
  created_at: string;
  updated_at: string;
}

// Months
export type MonthStatus = "open" | "closed";

export interface Month {
  id: number;
  month_year: string; // YYYY-MM-DD format, always 1st of month
  status: MonthStatus;
  total_shuttlecock_expense: number;
  created_at: string;
  updated_at: string;
}

// Sessions (buoi danh)
export interface Session {
  id: number;
  month_id: number;
  session_date: string; // YYYY-MM-DD
  court_expense_amount: number;
  payer_user_id: string; // user id
  notes?: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

// Session Attendance
export interface SessionAttendance {
  id: number;
  session_id: number;
  user_id: string;
  is_attended: boolean;
  created_at: string;
}

// Shuttlecock Details
export interface ShuttlecockDetail {
  id: number;
  month_id: number;
  purchase_date: string; // YYYY-MM-DD
  quantity: number;
  unit_price: number;
  buyer_user_id: string;
  notes?: string;
  created_at: string;
}

// Monthly Settlement (result of tinh tien)
export interface MonthlySetting {
  id: number;
  month_id: number;
  user_id: string;
  court_fee: number;
  shuttlecock_fee: number;
  past_debt: number;
  balance_carried: number;
  court_payer_offset: number;
  shuttlecock_buyer_offset: number;
  event_debt: number;
  total_due: number;
  is_paid: boolean;
  paid_amount: number | null;
  paid_at: string | null;
  created_at: string;
}

// VietQR Payment
export interface VietQRPayment {
  id: number;
  settlement_id: number;
  user_id: string;
  qr_content: string; // e.g. "vietqr://..."
  qr_image_url?: string; // optional URL if stored
  paid_at?: string;
  created_at: string;
}

// Event
export interface Event {
  id: number;
  event_name: string;
  event_date: string; // YYYY-MM-DD
  total_support: number;
  total_expense: number;
  month_id?: number | null;
  created_at: string;
  updated_at: string;
}

// Event Participant
export interface EventParticipant {
  id: number;
  event_id: number;
  user_id: string;
  contribution_per_person: number;
  is_paid: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  session?: string;
}
