import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService, createAuthService } from "./auth.service";
import * as supabaseModule from "@/lib/supabase";

let mockAdminClient: any;

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(),
  createAdminClient: vi.fn(() => mockAdminClient),
}));

describe("AuthService session", () => {
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

  describe("getSession & getCurrentUser", () => {
    it("getSession should return active session", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { access_token: "123" } },
        error: null,
      });
      const result = await service.getSession();
      expect(result.access_token).toBe("123");
    });

    it("getSession should throw if no session", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });
      await expect(service.getSession()).rejects.toThrow("No active session");
    });

    it("getCurrentUser should combine session user and profile data", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: "u1", email: "a@c", user_metadata: { name: "Meta Name" } } } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "NotFound" } });

      const result = await service.getCurrentUser();
      expect(result.name).toBe("Meta Name");
      expect(result.role).toBe("member");
    });

    it("getCurrentUser should fallback to profile email if session email missing", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: "u1", email: undefined } } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: { email: "prof@email.com", role: "admin" }, error: null });

      const result = await service.getCurrentUser();
      expect(result.email).toBe("prof@email.com");
    });

    it("getCurrentUser should fallback to empty string if both emails missing", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: "u1", email: undefined } } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: { email: undefined, role: "admin" }, error: null });

      const result = await service.getCurrentUser();
      expect(result.email).toBe("");
    });
  });

  describe("refreshSession & signOut", () => {
    it("refreshSession should return refreshed session", async () => {
      mockSupabase.auth.refreshSession.mockResolvedValueOnce({
        data: { session: { new_token: "456" } },
        error: null,
      });
      const result = await service.refreshSession();
      expect(result.new_token).toBe("456");
    });

    it("refreshSession should throw if failed", async () => {
      mockSupabase.auth.refreshSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: "Expired" },
      });
      await expect(service.refreshSession()).rejects.toThrow("Failed to refresh session");
    });

    it("signOut should clear session", async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
      await service.signOut();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("signOut should throw ServerError if it fails", async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: { message: "Network failed" } });
      await expect(service.signOut()).rejects.toThrow("Sign out failed");
    });
  });

  describe("createAuthService", () => {
    it("should initialize supabase client and return service instance", async () => {
      vi.mocked(supabaseModule.createServerSupabaseClient).mockResolvedValueOnce(mockSupabase as any);
      const authService = await createAuthService();
      expect(authService).toBeInstanceOf(AuthService);
      expect(supabaseModule.createServerSupabaseClient).toHaveBeenCalled();
    });
  });
});
