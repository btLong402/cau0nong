/**
 * Users Service
 * Business logic for user management
 */

import { User } from "@/lib/types";
import { UsersRepository, createUsersRepository } from "./users.repository";
import { ConflictError, NotFoundError } from "@/shared/api";

import { createAuthService } from "@/modules/auth/auth.service";

export interface CreateUserData {
  username?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role?: "admin" | "member";
}
export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string | null;
}

/**
 * Users Service
 */
export class UsersService {
  constructor(private repository: UsersRepository) {}

  /**
   * Create a new member (admin operation)
   */
  async createMember(data: CreateUserData): Promise<User> {
    const authService = await createAuthService();
    const normalizedUsername = (data.username || data.email.split("@")[0] || data.phone)
      .trim()
      .toLowerCase();

    // Sign up via AuthService (which also creates the profile)
    const result = await authService.createAdminUser({
      username: normalizedUsername,
      email: data.email,
      password: data.password || "123456", // Default password if not provided
      name: data.name,
      phone: data.phone,
    });

    // If role is admin, update it (AuthService defaults to member)
    if (data.role === "admin") {
      await this.repository.updateProfile(result.user.id, { role: "admin" });
    }

    return await this.getMember(result.user.id);
  }

  /**
   * Get all active members with pagination
   */
  async listMembers(page: number = 1, limit: number = 20): Promise<{
    members: User[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    const members = await this.repository.findAll(limit, offset);
    const total = await this.repository.count({});
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
   * Get member by username
   */
  async getMemberByUsername(username: string): Promise<User | null> {
    return await this.repository.findByUsername(username);
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
        throw new ConflictError("Email already in use");
      }
    }

    // Check if new phone is unique (if changing)
    if (data.phone && data.phone !== user.phone) {
      const existing = await this.repository.findByPhone(data.phone);
      if (existing) {
        throw new ConflictError("Phone already in use");
      }
    }

    return await this.repository.updateProfile(userId, {
      name: data.name || user.name,
      email: data.email || user.email,
      phone: data.phone || user.phone,
      avatar_url:
        data.avatar_url === undefined ? user.avatar_url : data.avatar_url,
    });
  }

  /**
   * Deactivate member
   */
  async deactivateMember(userId: string): Promise<User> {
    await this.getMember(userId);
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
   * Approve account so user can login
   */
  async approveMember(userId: string): Promise<User> {
    await this.getMember(userId);
    const approvedUser = await this.repository.updateApprovalStatus(userId, "approved");

    try {
      const authService = await createAuthService();
      await authService.confirmEmailForUser(userId);
    } catch (error) {
      console.error(`Failed to confirm auth email for user ${userId}:`, error);
    }

    return approvedUser;
  }

  /**
   * Reject account registration
   */
  async rejectMember(userId: string): Promise<User> {
    await this.getMember(userId);
    return await this.repository.updateApprovalStatus(userId, "rejected");
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
    pendingApprovals: number;
  }> {
    const total = await this.repository.count({});
    const active = await this.repository.countActive();
    const admins = (await this.repository.findByRole("admin")).length;
    const pendingApprovals = await this.repository.countByApprovalStatus("pending");

    return {
      totalMembers: total,
      activeMembers: active,
      admins,
      pendingApprovals,
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
