import { VietQRPayment } from "@/lib/types";

export interface SettlementPaymentSummary {
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

export interface PaymentListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "paid" | "unpaid";
}

export interface PaymentListResult {
  items: SettlementPaymentSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
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
  payment: VietQRPayment;
  payload: VietQRPayload;
}
