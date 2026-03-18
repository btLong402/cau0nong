/**
 * Months Repository
 * Database access layer for billing cycles
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { Month } from "@/lib/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Months Repository
 */
export class MonthsRepository extends Repository<Month> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "months", "id");
  }

  /**
   * Find months by status
   */
  async findByStatus(status: "open" | "closed"): Promise<Month[]> {
    try {
      return await this.find({ status });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find month by month_year
   */
  async findByMonthYear(monthYear: string): Promise<Month | null> {
    try {
      const months = await this.find({ month_year: monthYear });
      return months.length > 0 ? months[0] : null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Get all open months
   */
  async findAllOpen(): Promise<Month[]> {
    try {
      return await this.find({ status: "open" });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Get all months sorted by date descending
   */
  async findAllSorted(): Promise<Month[]> {
    try {
      const allMonths = await this.find({});
      return allMonths.sort(
        (a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime()
      );
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Update month status
   */
  async updateStatus(monthId: number, status: "open" | "closed"): Promise<Month> {
    try {
      return await this.update(monthId, {
        status,
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Update total shuttlecock expense
   */
  async updateShuttlecockExpense(
    monthId: number,
    amount: number
  ): Promise<Month> {
    try {
      return await this.update(monthId, {
        total_shuttlecock_expense: amount,
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }
}

/**
 * Create months repository with server Supabase client
 */
export async function createMonthsRepository() {
  const supabase = await createServerSupabaseClient();
  return new MonthsRepository(supabase);
}
