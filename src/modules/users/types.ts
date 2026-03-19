export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar_url?: string | null;
  balance: number;
  role: string;
}

export interface CurrentMonthSummary {
  month_id: number;
  month_year: string;
  status: string;
  total_sessions: number;
  sessions_attended: number;
}

export interface CurrentSettlement {
  id: number;
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
}

export interface PaymentHistoryItem {
  month_year: string;
  court_fee: number;
  shuttlecock_fee: number;
  total_due: number;
  is_paid: boolean;
  paid_amount: number | null;
  paid_at: string | null;
}

export interface MyAccountDashboardData {
  profile: UserProfile | null;
  current_month: CurrentMonthSummary | null;
  current_settlement: CurrentSettlement | null;
  payment_history: PaymentHistoryItem[];
}

export interface MyAccountFormValues {
  name: string;
  phone: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface MemberUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  balance: number;
  is_active: boolean;
  approval_status: ApprovalStatus;
}

export interface CreateMemberFormData {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}
