import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase";
import { AuthenticationError, ConflictError, ServerError } from "@/shared/api";
import {
  assertAccountCanLogin,
  createUserProfile,
  getUserById,
  resolveEmailForLogin,
} from "./auth.service.helpers";
import {
  AuthResponse,
  CurrentUserResponse,
  SignInData,
  SignUpData,
} from "./auth.types";

export type { SignUpData, SignInData, AuthResponse, CurrentUserResponse } from "./auth.types";
export class AuthService {
  private supabase;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            name: data.name,
            phone: data.phone,
            role: "member",
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

      const adminClient = createAdminClient();
      await createUserProfile(adminClient, {
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

  async createAdminUser(data: SignUpData): Promise<AuthResponse> {
    try {
      const adminClient = createAdminClient();

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
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

      await createUserProfile(adminClient, {
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
      throw new ServerError(`Create user failed: ${error}`);
    }
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const identifier = data.identifier || data.email;
      if (!identifier) {
        throw new AuthenticationError("Missing login identifier");
      }

      const emailForAuth = await resolveEmailForLogin(identifier);

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

      const userProfile = await this.getUserById(authData.user.id);
      assertAccountCanLogin(userProfile, () => this.supabase.auth.signOut());

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

  async signInWithPhone(phone: string, password: string): Promise<AuthResponse> {
    return this.signIn({ identifier: phone, password });
  }

  async signInWithUsername(username: string, password: string): Promise<AuthResponse> {
    return this.signIn({ identifier: username, password });
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error || !data?.session) {
      throw new AuthenticationError("No active session");
    }

    return data.session;
  }

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

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error || !data?.session) {
      throw new AuthenticationError("Failed to refresh session");
    }

    return data.session;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new ServerError("Sign out failed");
    }
  }

  async confirmEmailForUser(userId: string): Promise<void> {
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      throw new ServerError(`Failed to confirm user email: ${error.message}`);
    }
  }

  async getUserById(userId: string) {
    return getUserById(this.supabase, userId);
  }
}

export async function createAuthService() {
  const supabase = await createServerSupabaseClient();
  return new AuthService(supabase);
}
