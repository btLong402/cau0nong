import { createServerSupabaseClient } from "@/lib/supabase";
import { MonthlySetting, VietQRPayment } from "@/lib/types";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { SupabaseClient } from "@supabase/supabase-js";
import { SettlementPaymentSummary } from "./payments.types";

interface SettlementWithUser extends MonthlySetting {
  users?: { name?: string; email?: string } | { name?: string; email?: string }[] | null;
}

function normalizeProfile(
  users: SettlementWithUser["users"]
): { name: string | null; email: string | null } {
  if (!users) {
    return { name: null, email: null };
  }

  const profile = Array.isArray(users) ? users[0] : users;
  return {
    name: profile?.name || null,
    email: profile?.email || null,
  };
}

export class PaymentsRepository extends Repository<VietQRPayment> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "vietqr_payments", "id");
  }

  async findLatestBySettlement(settlementId: number): Promise<VietQRPayment | null> {
    try {
      const { data, error } = await this.supabase
        .from("vietqr_payments")
        .select("*")
        .eq("settlement_id", settlementId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data as VietQRPayment | null) || null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  async createVietQRPayment(data: Omit<VietQRPayment, "id" | "created_at">): Promise<VietQRPayment> {
    try {
      const { data: created, error } = await this.supabase
        .from("vietqr_payments")
        .insert([
          {
            ...data,
            created_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return created as VietQRPayment;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  async listByMonth(
    monthId: number,
    page: number,
    limit: number,
    search?: string,
    status: "all" | "paid" | "unpaid" = "all"
  ): Promise<{ items: SettlementPaymentSummary[]; total: number }> {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      let query = this.supabase
        .from("monthly_settlements")
        .select("*, users(name, email)", { count: "exact" })
        .eq("month_id", monthId);

      if (status === "paid") {
        query = query.eq("is_paid", true);
      } else if (status === "unpaid") {
        query = query.eq("is_paid", false);
      }

      const keyword = search?.trim();
      if (keyword) {
        const escaped = keyword.replace(/,/g, "\\,");
        query = query.or(
          `user_id.ilike.%${escaped}%,users.name.ilike.%${escaped}%,users.email.ilike.%${escaped}%`
        );
      }

      const { data: settlementsData, error, count } = await query
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) {
        throw error;
      }

      const settlements = (settlementsData || []) as SettlementWithUser[];
      if (settlements.length === 0) {
        return {
          items: [],
          total: count || 0,
        };
      }

      const settlementIds = settlements.map((item) => item.id);
      const { data: paymentRows, error: paymentError } = await this.supabase
        .from("vietqr_payments")
        .select("*")
        .in("settlement_id", settlementIds)
        .order("created_at", { ascending: false });

      if (paymentError) {
        throw paymentError;
      }

      const latestBySettlement = new Map<number, VietQRPayment>();
      for (const row of (paymentRows || []) as VietQRPayment[]) {
        if (!latestBySettlement.has(row.settlement_id)) {
          latestBySettlement.set(row.settlement_id, row);
        }
      }

      const items = settlements.map((settlement) => {
        const payment = latestBySettlement.get(settlement.id);
        const profile = normalizeProfile(settlement.users);

        return {
          settlement_id: settlement.id,
          user_id: settlement.user_id,
          user_name: profile.name,
          user_email: profile.email,
          month_id: settlement.month_id,
          total_due: settlement.total_due,
          is_paid: settlement.is_paid,
          paid_amount: settlement.paid_amount,
          paid_at: settlement.paid_at,
          qr_content: payment?.qr_content || null,
          qr_image_url: payment?.qr_image_url || null,
          qr_created_at: payment?.created_at || null,
        } satisfies SettlementPaymentSummary;
      });

      return {
        items,
        total: count || 0,
      };
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }
}

export async function createPaymentsRepository() {
  const supabase = await createServerSupabaseClient();
  return new PaymentsRepository(supabase);
}
