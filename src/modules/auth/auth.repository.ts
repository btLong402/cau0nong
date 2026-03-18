/**
 * Authentication Repository
 * Handles database-level auth operations and sync with public.users table
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { Repository, mapSupabaseError } from "@/shared/lib";
import { User } from "@/lib/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Auth Repository
 * Specialized repository for authentication-related database operations
 */
export class AuthRepository extends Repository<User> {
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
   * Find all active users
   */
  async findAllActive(): Promise<User[]> {
    try {
      return await this.find({ is_active: true });
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Create new user with default values
   */
  async createUser(data: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: "admin" | "member";
  }): Promise<User> {
    try {
      return await this.create({
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        balance: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      throw mapSupabaseError(error);
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<User> {
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
   * Check if email is already taken
   */
  async isEmailTaken(email: string): Promise<boolean> {
    try {
      return await this.exists({ email });
    } catch {
      return false;
    }
  }

  /**
   * Check if phone is already taken
   */
  async isPhoneTaken(phone: string): Promise<boolean> {
    try {
      return await this.exists({ phone });
    } catch {
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
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
 * Create auth repository with server Supabase client
 */
export async function createAuthRepository() {
  const supabase = await createServerSupabaseClient();
  return new AuthRepository(supabase);
}
