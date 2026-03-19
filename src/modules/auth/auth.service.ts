/**
 * Authentication Service
 * Handles user registration, login, session management with Supabase Auth
 */

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase";
import { AuthenticationError, ConflictError, ServerError } from "@/shared/api";
import { NextRequest } from "next/server";

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface SignInData {
  identifier?: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    name?: string;
    role: "admin" | "member";
    approvalStatus: "pending" | "approved" | "rejected";
  };
  token: string;
}

export interface CurrentUserResponse {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: "admin" | "member";
  approvalStatus: "pending" | "approved" | "rejected";
}

/**
 * Authentication Service
 * Handles all auth operations via Supabase
 */
export class AuthService {
  private supabase;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Sign up new user with email and password
   * Creates both auth user and profile entry
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      // Create Supabase Auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            name: data.name,
            phone: data.phone,
            role: "member", // Default role
            approval_status: "pending",
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already")) {
          throw new ConflictError("Email already registered");
        }
        throw new AuthenticationError(authError.message);
      }

      if (!authData.user) {
        throw new ServerError("Failed to create user");
      }

      // Create user profile in public.users table
      const adminClient = createAdminClient();
      await this.createUserProfile(adminClient, {
        id: authData.user.id,
        username: data.username,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: "member",
        approval_status: "pending",
        is_active: false,
      });

      return {
        user: {
          id: authData.user.id,
          username: data.username,
          email: authData.user.email!,
          name: data.name,
          role: "member",
          approvalStatus: "pending",
        },
        token: "",
      };
    } catch (error) {
      if (
        error instanceof ConflictError ||
        error instanceof AuthenticationError ||
        error instanceof ServerError
      ) {
        throw error;
      }
      throw new ServerError(`Sign up failed: ${error}`);
    }
  }

  /**
   * Create a new user as an admin (bypasses rate limits and email confirmation)
   */
  async createAdminUser(data: SignUpData): Promise<AuthResponse> {
    try {
      const adminClient = createAdminClient();
      
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto confirm so they can login immediately
        user_metadata: {
          username: data.username,
          name: data.name,
          phone: data.phone,
          role: "member",
          approval_status: "approved",
        },
      });

      if (authError) {
        if (authError.message.includes("already")) {
          throw new ConflictError("Email already registered");
        }
        throw new AuthenticationError(authError.message);
      }

      if (!authData.user) {
        throw new ServerError("Failed to create user");
      }

      // Create user profile in public.users table
      await this.createUserProfile(adminClient, {
        id: authData.user.id,
        username: data.username,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: "member",
        approval_status: "approved",
        is_active: true,
      });

      return {
        user: {
          id: authData.user.id,
          username: data.username,
          email: authData.user.email!,
          name: data.name,
          role: "member",
          approvalStatus: "approved",
        },
        token: "", // No token when admin creates another user
      };
    } catch (error) {
      if (
        error instanceof ConflictError ||
        error instanceof AuthenticationError ||
        error instanceof ServerError
      ) {
        throw error;
      }
      throw new ServerError(`Create user failed: ${error}`);
    }
  }

  /**
   * Sign in with user name or email and password
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const identifier = data.identifier || data.email;
      if (!identifier) {
        throw new AuthenticationError("Missing login identifier");
      }

      const emailForAuth = await this.resolveEmailForLogin(identifier);

      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: emailForAuth,
        password: data.password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          throw new AuthenticationError("Email chưa được xác nhận. Vui lòng liên hệ admin để kích hoạt tài khoản.");
        }
        throw new AuthenticationError("Invalid email or password");
      }

      if (!authData.user || !authData.session) {
        throw new ServerError("Failed to authenticate");
      }

      // Fetch user profile to get full details
      const userProfile = await this.getUserById(authData.user.id);
      this.assertAccountCanLogin(userProfile);

      return {
        user: {
          id: authData.user.id,
          username: userProfile?.username || "",
          email: authData.user.email!,
          name: userProfile?.name,
          role: userProfile?.role || "member",
          approvalStatus: userProfile?.approval_status || "pending",
        },
        token: authData.session.access_token,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new ServerError(`Sign in failed: ${error}`);
    }
  }

  /**
   * Sign in with phone number + password
   * Looks up email by phone, then delegates to signIn
   */
  async signInWithPhone(phone: string, password: string): Promise<AuthResponse> {
    return this.signIn({ identifier: phone, password });
  }

  /**
   * Sign in with username + password
   */
  async signInWithUsername(username: string, password: string): Promise<AuthResponse> {
    return this.signIn({ identifier: username, password });
  }

  /**
   * Get current authenticated user session
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error || !data?.session) {
      throw new AuthenticationError("No active session");
    }

    return data.session;
  }

  /**
   * Get current authenticated user with profile data.
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const session = await this.getSession();
    const profile = await this.getUserById(session.user.id);

    return {
      id: session.user.id,
      username: profile?.username || (session.user.user_metadata?.username as string | undefined) || "",
      email: session.user.email || profile?.email || "",
      name: profile?.name || (session.user.user_metadata?.name as string | undefined),
      role: (profile?.role as "admin" | "member") || "member",
      approvalStatus:
        (profile?.approval_status as "pending" | "approved" | "rejected") ||
        ((session.user.user_metadata?.approval_status as "pending" | "approved" | "rejected") ?? "pending"),
    };
  }

  /**
   * Refresh JWT access token
   */
  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error || !data?.session) {
      throw new AuthenticationError("Failed to refresh session");
    }

    return data.session;
  }

  /**
   * Sign out (invalidate session)
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new ServerError("Sign out failed");
    }
  }

  /**
   * Confirm auth email by user ID (admin operation)
   */
  async confirmEmailForUser(userId: string): Promise<void> {
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      throw new ServerError(`Failed to confirm user email: ${error.message}`);
    }
  }

  /**
   * Create user profile in public.users table
   * This mirrors the auth user for easier querying
   */
  private async createUserProfile(adminClient: any, profile: {
    id: string;
    username: string;
    email: string;
    name: string;
    phone: string;
    role: "admin" | "member";
    approval_status: "pending" | "approved" | "rejected";
    is_active: boolean;
  }) {
    const { error } = await adminClient.from("users").insert([
      {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        balance: 0,
        is_active: profile.is_active,
        approval_status: profile.approval_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Failed to create user profile:", error);
      // Don't throw - auth user is already created
      // This can be synced later or created manually
    }
  }

  /**
   * Get user by ID from public.users table
   */
  async getUserById(userId: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  private async resolveEmailForLogin(identifier: string): Promise<string> {
    if (identifier.includes("@")) {
      return identifier.trim().toLowerCase();
    }

    const normalized = identifier.trim().toLowerCase();

    // Pre-login lookup cannot rely on anon client because RLS blocks public.users.
    // Use admin client for identifier -> email mapping and still return generic error.
    const adminClient = createAdminClient();

    const isPhoneLike = /^(\+?\d{9,15}|0\d{8,11})$/.test(normalized);

    const getAuthEmailByUserId = async (userId: string): Promise<string | null> => {
      try {
        const authLookup = await adminClient.auth.admin.getUserById(userId);
        const authEmail = authLookup?.data?.user?.email;
        return authEmail ? String(authEmail).trim().toLowerCase() : null;
      } catch {
        return null;
      }
    };

    if (isPhoneLike) {
      const phoneLookup = await adminClient
        .from("users")
        .select("id,email")
        .eq("phone", normalized)
        .limit(1)
        .single();

      const profileUserId = phoneLookup.data?.id as string | undefined;
      if (profileUserId) {
        const authEmail = await getAuthEmailByUserId(profileUserId);
        if (authEmail) {
          return authEmail;
        }
      }

      if (phoneLookup.data?.email) {
        return String(phoneLookup.data.email).trim().toLowerCase();
      }

      throw new AuthenticationError("Invalid username/phone or password");
    }

    const usernameLookup = await adminClient
      .from("users")
      .select("id,email")
      .eq("username", normalized)
      .limit(1)
      .single();

    const profileUserId = usernameLookup.data?.id as string | undefined;
    if (profileUserId) {
      const authEmail = await getAuthEmailByUserId(profileUserId);
      if (authEmail) {
        return authEmail;
      }
    }

    if (usernameLookup.data?.email) {
      return String(usernameLookup.data.email).trim().toLowerCase();
    }

    throw new AuthenticationError("Invalid username/phone or password");
  }

  private assertAccountCanLogin(profile: any): asserts profile is {
    username: string;
    approval_status: "pending" | "approved" | "rejected";
    is_active: boolean;
    name?: string;
    role: "admin" | "member";
  } {
    if (!profile) {
      throw new AuthenticationError("Account profile not found");
    }

    if (profile.approval_status === "pending") {
      void this.supabase.auth.signOut();
      throw new AuthenticationError("Tài khoản đang chờ admin duyệt");
    }

    if (profile.approval_status === "rejected") {
      void this.supabase.auth.signOut();
      throw new AuthenticationError("Tài khoản đã bị từ chối. Vui lòng liên hệ admin");
    }

    if (!profile.is_active) {
      void this.supabase.auth.signOut();
      throw new AuthenticationError("Tài khoản đã bị vô hiệu hóa");
    }
  }
}

/**
 * Create auth service instance with server Supabase client
 */
export async function createAuthService() {
  const supabase = await createServerSupabaseClient();
  return new AuthService(supabase);
}
