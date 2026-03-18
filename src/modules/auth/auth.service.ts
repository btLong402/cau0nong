/**
 * Authentication Service
 * Handles user registration, login, session management with Supabase Auth
 */

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase";
import { AuthenticationError, ConflictError, ServerError } from "@/shared/api";
import { NextRequest } from "next/server";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    role: "admin" | "member";
  };
  token: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "member";
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
            name: data.name,
            phone: data.phone,
            role: "member", // Default role
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
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: "member",
      });

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name: data.name,
          role: "member",
        },
        token: authData.session?.access_token || "",
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
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new AuthenticationError("Invalid email or password");
      }

      if (!authData.user || !authData.session) {
        throw new ServerError("Failed to authenticate");
      }

      // Fetch user profile to get full details
      const userProfile = await this.getUserById(authData.user.id);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name: userProfile?.name,
          role: userProfile?.role || "member",
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
    // Lookup user by phone to get email
    const { data: userData, error: lookupError } = await this.supabase
      .from("users")
      .select("email")
      .eq("phone", phone)
      .eq("is_active", true)
      .single();

    if (lookupError || !userData?.email) {
      throw new AuthenticationError("Phone number not found or inactive");
    }

    // Delegate to email-based sign in
    return this.signIn({ email: userData.email, password });
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
      email: session.user.email || profile?.email || "",
      name: profile?.name || (session.user.user_metadata?.name as string | undefined),
      role: (profile?.role as "admin" | "member") || "member",
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
   * Create user profile in public.users table
   * This mirrors the auth user for easier querying
   */
  private async createUserProfile(adminClient: any, profile: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: "admin" | "member";
  }) {
    const { error } = await adminClient.from("users").insert([
      {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        balance: 0,
        is_active: true,
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
}

/**
 * Create auth service instance with server Supabase client
 */
export async function createAuthService() {
  const supabase = await createServerSupabaseClient();
  return new AuthService(supabase);
}
