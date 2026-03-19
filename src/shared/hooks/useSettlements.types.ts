import { MonthlySetting } from "@/lib/types";

export interface SettlementListItem extends MonthlySetting {
  user_name: string | null;
  user_email: string | null;
}

export interface SettlementsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface MonthSettlementsResponse {
  items: SettlementListItem[];
  pagination: SettlementsPagination;
}

export interface SettlementResponse {
  settlement: MonthlySetting;
}

export interface GenerateSummary {
  monthId: number;
  generatedCount: number;
  totalDue: number;
  totalPaidCount: number;
}

export interface GenerateResponse {
  summary: GenerateSummary;
}

export interface VietQRPayload {
  bankBin: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
  template: string;
}

export interface GeneratedVietQR {
  payment: {
    id: number;
    settlement_id: number;
    user_id: string;
    qr_content: string;
    qr_image_url?: string;
    paid_at?: string;
    created_at: string;
  };
  payload: VietQRPayload;
}

export interface SettlementVietQRResponse {
  vietqr: GeneratedVietQR;
}

export interface MonthPaymentItem {
  settlement_id: number;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  month_id: number;
  total_due: number;
  is_paid: boolean;
  paid_amount: number | null;
  paid_at: string | null;
  qr_content: string | null;
  qr_image_url: string | null;
  qr_created_at: string | null;
}

export interface MonthPaymentResponse {
  items: MonthPaymentItem[];
  pagination: SettlementsPagination;
}

export interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseMonthSettlementsOptions {
  page?: number;
  limit?: number;
  status?: "all" | "paid" | "unpaid";
  search?: string;
  sortBy?: "total_due" | "created_at" | "paid_at" | "user_id";
  sortOrder?: "asc" | "desc";
}

export interface UseMonthPaymentHistoryOptions {
  page?: number;
  limit?: number;
  status?: "all" | "paid" | "unpaid";
  search?: string;
}
