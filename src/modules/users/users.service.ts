/**
 * Users Service
 * Business logic for user management
 */

import { User } from "@/lib/types";
import { UsersRepository, createUsersRepository } from "./users.repository";
import { NotFoundError } from "@/shared/api";

export interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  role?: "admin" | "member";
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Users Service
 */
export class UsersService {
  constructor(private repository: UsersRepository) {}

  /**
   * Get all active members with pagination
   */
  async listMembers(page: number = 1, limit: number = 20): Promise<{
    members: User[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    const members = await this.repository.findAllActive(limit, offset);
    const total = await this.repository.countActive();
    const hasMore = offset + limit < total;

    return { members, total, hasMore };
  }

  /**
   * Get member by ID
   */
  async getMember(userId: string): Promise<User> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new NotFoundError("Member");
    }

    return user;
  }

  /**
   * Get member by email
   */
  async getMemberByEmail(email: string): Promise<User | null> {
    return await this.repository.findByEmail(email);
  }

  /**
   * Get member by phone
   */
  async getMemberByPhone(phone: string): Promise<User | null> {
    return await this.repository.findByPhone(phone);
  }

  /**
   * Update member profile
   */
  async updateMember(userId: string, data: UpdateUserData): Promise<User> {
    const user = await this.getMember(userId);

    // Check if new email is unique (if changing)
    if (data.email && data.email !== user.email) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing) {
        throw new Error("Email already in use");
      }
    }

    // Check if new phone is unique (if changing)
    if (data.phone && data.phone !== user.phone) {
      const existing = await this.repository.findByPhone(data.phone);
      if (existing) {
        throw new Error("Phone already in use");
      }
    }

    return await this.repository.updateProfile(userId, {
      name: data.name || user.name,
      email: data.email || user.email,
      phone: data.phone || user.phone,
    });
  }

  /**
   * Deactivate member
   */
  async deactivateMember(userId: string): Promise<User> {
    const user = await this.getMember(userId);
    return await this.repository.deactivate(userId);
  }

  /**
   * Reactivate member
   */
  async reactivateMember(userId: string): Promise<User> {
    // Note: This doesn't check if user exists in auth - just reactivates profile
    return await this.repository.reactivate(userId);
  }

  /**
   * Get members by role (admin only operation)
   */
  async getMembersByRole(role: "admin" | "member"): Promise<User[]> {
    return await this.repository.findByRole(role);
  }

  /**
   * Update user balance (used during settlement calculations in Phase 2)
   */
  async updateBalance(userId: string, newBalance: number): Promise<User> {
    return await this.repository.updateBalance(userId, newBalance);
  }

  /**
   * Get admin-only user stats
   */
  async getStats(): Promise<{
    totalMembers: number;
    activeMembers: number;
    admins: number;
  }> {
    const total = await this.repository.count({});
    const active = await this.repository.countActive();
    const admins = (await this.repository.findByRole("admin")).length;

    return {
      totalMembers: total,
      activeMembers: active,
      admins,
    };
  }

  /**
   * Search users by keyword
   */
  async searchUsers(query: string): Promise<User[]> {
    return await this.repository.searchUsers(query);
  }
}

/**
 * Create users service with injected repository
 */
export async function createUsersService() {
  const repository = await createUsersRepository();
  return new UsersService(repository);
}
