import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService } from "./auth.service";
import { AuthenticationError, ConflictError, ServerError } from "@/shared/api";

let mockAdminClient: any;

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(),
  createAdminClient: vi.fn(() => mockAdminClient),
}));

describe("AuthService auth flow", () => {
  let service: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        getSession: vi.fn(),
        refreshSession: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockAdminClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          updateUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      },
    };

    service = new AuthService(mockSupabase);
  });

  describe("signUp", () => {
    const validData = {
      username: "user_01",
      email: "a@b.c",
      password: "123",
      name: "User",
      phone: "098",
    };

    it("should successfully sign up and create a user profile", async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: "u1", email: "a@b.c" }, session: { access_token: "token123" } },
        error: null,
      });
      mockAdminClient.insert.mockResolvedValueOnce({ error: null });

      const result = await service.signUp(validData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalled();
      expect(mockAdminClient.insert).toHaveBeenCalled();
      expect(result.token).toBe("");
      expect(result.user.id).toBe("u1");
      expect(result.user.approvalStatus).toBe("pending");
    });

    it("should fallback empty token if session has no access_token", async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: "u1", email: "a@b.c" }, session: { access_token: null } },
        error: null,
      });
      mockAdminClient.insert.mockResolvedValueOnce({ error: null });

      const result = await service.signUp(validData);
      expect(result.token).toBe("");
    });

    it("should throw ConflictError if email is already registered", async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "User already registered" },
      });

      await expect(service.signUp(validData)).rejects.toThrow(ConflictError);
    });

    it("should throw AuthenticationError for other auth errors", async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Password is too weak" },
      });

      await expect(service.signUp(validData)).rejects.toThrow(AuthenticationError);
    });

    it("should throw ServerError if authData.user is missing but no error was thrown", async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      await expect(service.signUp(validData)).rejects.toThrow("Failed to create user");
    });

    it("should console.error if profile creation fails but still return auth user", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: "u1", email: "a@b.c" }, session: { access_token: "token123" } },
        error: null,
      });
      mockAdminClient.insert.mockResolvedValueOnce({ error: { message: "DB Error" } });

      const result = await service.signUp(validData);

      expect(consoleSpy).toHaveBeenCalledWith("Failed to create user profile:", { message: "DB Error" });
      expect(result.user.id).toBe("u1");
      consoleSpy.mockRestore();
    });

    it("should wrap other unknown errors in ServerError", async () => {
      mockSupabase.auth.signUp.mockRejectedValueOnce(new Error("Network Fail"));
      await expect(service.signUp(validData)).rejects.toThrow(ServerError);
    });
  });

  describe("signIn", () => {
    const validData = { email: "a@b.c", password: "123" };

    it("should successfully sign in", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "u1", email: "a@b.c" }, session: { access_token: "token123" } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          username: "admin_user",
          name: "Full Name",
          role: "admin",
          approval_status: "approved",
          is_active: true,
        },
        error: null,
      });

      const result = await service.signIn(validData);

      expect(result.token).toBe("token123");
      expect(result.user.name).toBe("Full Name");
      expect(result.user.role).toBe("admin");
    });

    it("should throw AuthenticationError if profile fetch fails", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "u1", email: "a@b.c" }, session: { access_token: "token123" } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

      await expect(service.signIn(validData)).rejects.toThrow(AuthenticationError);
    });

    it("should throw AuthenticationError if invalid credentials", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      await expect(service.signIn(validData)).rejects.toThrow(AuthenticationError);
    });

    it("should throw explicit error when email is not confirmed", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Email not confirmed" },
      });

      await expect(service.signIn(validData)).rejects.toThrow("Email chưa được xác nhận");
    });

    it("should throw ServerError if authData.user or session is missing without error", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "u1" }, session: null },
        error: null,
      });

      await expect(service.signIn(validData)).rejects.toThrow("Failed to authenticate");
    });

    it("should wrap unknown errors in ServerError unless it is AuthenticationError", async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error("DB connection dead"));
      await expect(service.signIn(validData)).rejects.toThrow(ServerError);
    });

    it("should resolve username to email before password sign-in", async () => {
      mockAdminClient.single.mockResolvedValueOnce({
        data: { id: "u2", email: "member@test.com" },
        error: null,
      });
      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "u2", email: "member@test.com" } },
        error: null,
      });
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "u2", email: "member@test.com" }, session: { access_token: "token-2" } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          username: "member01",
          name: "Member 01",
          role: "member",
          approval_status: "approved",
          is_active: true,
        },
        error: null,
      });

      const result = await service.signIn({ identifier: "member01", password: "123" });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "member@test.com",
        password: "123",
      });
      expect(result.user.username).toBe("member01");
      expect(result.token).toBe("token-2");
    });

    it("should use auth email when profile email is outdated for username login", async () => {
      mockAdminClient.single.mockResolvedValueOnce({
        data: { id: "u3", email: "old-profile-email@test.com" },
        error: null,
      });
      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "u3", email: "real-auth-email@test.com" } },
        error: null,
      });
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: "u3", email: "real-auth-email@test.com" },
          session: { access_token: "token-3" },
        },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          username: "longbt",
          name: "Long",
          role: "member",
          approval_status: "approved",
          is_active: true,
        },
        error: null,
      });

      await service.signIn({ identifier: "longbt", password: "123456" });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "real-auth-email@test.com",
        password: "123456",
      });
    });
  });

  describe("signInWithPhone", () => {
    it("should delegate phone identifier to signIn", async () => {
      const signInSpy = vi.spyOn(service, "signIn").mockResolvedValueOnce({ token: "123" } as any);

      const result = await service.signInWithPhone("0987654321", "password");

      expect(signInSpy).toHaveBeenCalledWith({ identifier: "0987654321", password: "password" });
      expect(result.token).toBe("123");
    });

    it("should throw AuthenticationError if phone not found", async () => {
      mockAdminClient.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });
      await expect(service.signInWithPhone("000", "123")).rejects.toThrow("Invalid username/phone or password");
    });
  });
});
