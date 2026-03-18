/**
 * Shuttlecock Details Repository
 * Database access layer for shuttlecock purchase records
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { ShuttlecockDetail } from "@/lib/types";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { SupabaseClient } from "@supabase/supabase-js";

export class ShuttlecocksRepository extends Repository<ShuttlecockDetail> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "shuttlecock_details", "id");
  }

  /**
   * Find all shuttlecock details for a month, sorted by purchase_date desc
   */
  async findByMonth(monthId: number): Promise<ShuttlecockDetail[]> {
    try {
      const { data, error } = await this.supabase
        .from("shuttlecock_details")
        .select("*")
        .eq("month_id", monthId)
        .order("purchase_date", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as ShuttlecockDetail[];
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find shuttlecock details with buyer user info
   */
  async findByMonthWithBuyer(monthId: number): Promise<
    (ShuttlecockDetail & { buyer_name: string | null })[]
  > {
    try {
      const { data, error } = await this.supabase
        .from("shuttlecock_details")
        .select("*, users!buyer_user_id(name)")
        .eq("month_id", monthId)
        .order("purchase_date", { ascending: false });

      if (error) {
        throw error;
      }

      return ((data || []) as any[]).map((row) => {
        const buyerProfile = Array.isArray(row.users)
          ? row.users[0]
          : row.users;
        return {
          ...row,
          buyer_name: buyerProfile?.name || null,
          users: undefined,
        };
      });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Create a shuttlecock detail record
   */
  async createDetail(data: {
    month_id: number;
    purchase_date: string;
    quantity: number;
    unit_price: number;
    buyer_user_id: string;
    notes?: string;
  }): Promise<ShuttlecockDetail> {
    try {
      return await this.create({
        ...data,
        created_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Update a shuttlecock detail record
   */
  async updateDetail(
    id: number,
    data: Partial<{
      purchase_date: string;
      quantity: number;
      unit_price: number;
      buyer_user_id: string;
      notes: string;
    }>
  ): Promise<ShuttlecockDetail> {
    try {
      return await this.update(id, data as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Delete a shuttlecock detail record
   */
  async deleteDetail(id: number): Promise<boolean> {
    try {
      return await this.delete(id);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }
}

export async function createShuttlecocksRepository() {
  const supabase = await createServerSupabaseClient();
  return new ShuttlecocksRepository(supabase);
}
