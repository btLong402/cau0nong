/**
 * Settlements Repository
 * Database access layer for monthly settlements.
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { MonthlySetting } from "@/lib/types";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { SupabaseClient } from "@supabase/supabase-js";

export type SettlementPaymentStatusFilter = "all" | "paid" | "unpaid";
export type SettlementSortBy = "total_due" | "created_at" | "paid_at" | "user_id";
export type SettlementSortOrder = "asc" | "desc";

export interface SettlementListQuery {
  monthId: number;
  page: number;
  limit: number;
  status: SettlementPaymentStatusFilter;
  search?: string;
  sortBy: SettlementSortBy;
  sortOrder: SettlementSortOrder;
}

export interface SettlementListItem extends MonthlySetting {
  user_name: string | null;
  user_email: string | null;
}

export interface SettlementListPage {
  items: SettlementListItem[];
  total: number;
}

interface SettlementUserRelation {
  name?: string;
  email?: string;
}

type SettlementRow = MonthlySetting & {
  users?: SettlementUserRelation | SettlementUserRelation[] | null;
};

function getProfile(row: SettlementRow): SettlementUserRelation | null {
  if (!row.users) {
    return null;
  }

  if (Array.isArray(row.users)) {
    return row.users[0] || null;
  }

  return row.users;
}

export class SettlementsRepository extends Repository<MonthlySetting> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "monthly_settlements", "id");
  }

  async findByMonth(monthId: number): Promise<MonthlySetting[]> {
    try {
      const records = await this.find({ month_id: monthId });
      return records.sort((a, b) => b.total_due - a.total_due);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  async findByMonthPaginated(query: SettlementListQuery): Promise<SettlementListPage> {
    try {
      const start = (query.page - 1) * query.limit;
      const end = start + query.limit - 1;

      let builder = this.supabase
        .from("monthly_settlements")
        .select("*, users(name, email)", { count: "exact" })
        .eq("month_id", query.monthId);

      if (query.status === "paid") {
        builder = builder.eq("is_paid", true);
      } else if (query.status === "unpaid") {
        builder = builder.eq("is_paid", false);
      }

      const normalizedSearch = query.search?.trim();
      if (normalizedSearch) {
        // Step 1: Find users matching the search criteria
        const { data: matchedUsers } = await this.supabase
          .from("users")
          .select("id")
          .or(`name.ilike.%${normalizedSearch}%,email.ilike.%${normalizedSearch}%`);

        const matchedIds = matchedUsers?.map(u => u.id) || [];

        // Step 2: Filter by these IDs or specific settlement fields
        // We use .in() for the user IDs match
        if (matchedIds.length > 0) {
          builder = builder.in("user_id", matchedIds);
        } else {
          // If no users match, but there's a search, we might want to return nothing 
          // unless the search string itself IS a valid UUID (unlikely for users)
          builder = builder.eq("user_id", "00000000-0000-0000-0000-000000000000"); // Empty result
        }
      }

      const { data, error, count } = await builder
        .order(query.sortBy, { ascending: query.sortOrder === "asc" })
        .range(start, end);

      if (error) {
        throw error;
      }

      const rows = ((data || []) as SettlementRow[]).map((row) => {
        const profile = getProfile(row);

        return {
          ...row,
          user_name: profile?.name || null,
          user_email: profile?.email || null,
        };
      });

      return {
        items: rows,
        total: count || 0,
      };
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  async findByMonthAndUser(
    monthId: number,
    userId: string
  ): Promise<MonthlySetting | null> {
    try {
      const { data, error } = await this.supabase
        .from("monthly_settlements")
        .select("*")
        .eq("month_id", monthId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data as MonthlySetting | null) || null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  async findPreviousByUser(
    monthId: number,
    userId: string
  ): Promise<MonthlySetting | null> {
    try {
      const { data, error } = await this.supabase
        .from("monthly_settlements")
        .select("*")
        .eq("user_id", userId)
        .lt("month_id", monthId)
        .order("month_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data as MonthlySetting | null) || null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  async upsertByMonthAndUser(
    rows: Array<Omit<MonthlySetting, "id" | "created_at">>
  ): Promise<MonthlySetting[]> {
    try {
      if (rows.length === 0) {
        return [];
      }

      const payload = rows.map((row) => ({
        ...row,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await this.supabase
        .from("monthly_settlements")
        .upsert(payload, {
          onConflict: "month_id,user_id",
        })
        .select("*");

      if (error) {
        throw error;
      }

      return (data || []) as MonthlySetting[];
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  async markPaid(settlementId: number, amount: number): Promise<MonthlySetting> {
    try {
      return await this.update(settlementId, {
        is_paid: true,
        paid_amount: amount,
        paid_at: new Date().toISOString(),
      });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }
}

export async function createSettlementsRepository() {
  const supabase = await createServerSupabaseClient();
  return new SettlementsRepository(supabase);
}
