/**
 * Users Repository
 * Database access layer for user profiles
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { User } from "@/lib/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Users Repository
 */
export class UsersRepository extends Repository<User> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "users", "id");
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.find({ email });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<User | null> {
    try {
      const users = await this.find({ phone });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find all active users (members)
   */
  async findAllActive(limit?: number, offset?: number): Promise<User[]> {
    try {
      return await this.find({ is_active: true }, limit, offset);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Count active users
   */
  async countActive(): Promise<number> {
    try {
      return await this.count({ is_active: true });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: "admin" | "member"): Promise<User[]> {
    try {
      return await this.find({ role, is_active: true });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Update user balance
   */
  async updateBalance(userId: string, newBalance: number): Promise<User> {
    try {
      return await this.update(userId, {
        balance: newBalance,
        updated_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(userId: string): Promise<User> {
    try {
      return await this.update(userId, {
        is_active: false,
        updated_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Reactivate user
   */
  async reactivate(userId: string): Promise<User> {
    try {
      return await this.update(userId, {
        is_active: true,
        updated_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: Partial<Omit<User, "id" | "created_at">>
  ): Promise<User> {
    try {
      return await this.update(userId, {
        ...data,
        updated_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }
}

/**
 * Create users repository with server Supabase client
 */
export async function createUsersRepository() {
  const supabase = await createServerSupabaseClient();
  return new UsersRepository(supabase);
}
