import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService, createAuthService } from './auth.service';
import * as supabaseModule from '@/lib/supabase';
import { AuthenticationError, ConflictError, ServerError } from '@/shared/api';

let mockAdminClient: any;

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
  createAdminClient: vi.fn(() => mockAdminClient),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup basic supabase mock
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
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    service = new AuthService(mockSupabase);
  });

  describe('signUp', () => {
    const validData = { username: 'user_01', email: 'a@b.c', password: '123', name: 'User', phone: '098' };

    it('should successfully sign up and create a user profile', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'a@b.c' }, session: { access_token: 'token123' } },
        error: null,
      });
      mockAdminClient.insert.mockResolvedValueOnce({ error: null });

      const result = await service.signUp(validData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalled();
      expect(mockAdminClient.insert).toHaveBeenCalled();
      expect(result.token).toBe('');
      expect(result.user.id).toBe('u1');
      expect(result.user.approvalStatus).toBe('pending');
    });

    it('should fallback empty token if session has no access_token', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'a@b.c' }, session: { access_token: null } },
        error: null,
      });
      mockAdminClient.insert.mockResolvedValueOnce({ error: null });

      const result = await service.signUp(validData);
      expect(result.token).toBe('');
    });

    it('should throw ConflictError if email is already registered', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      await expect(service.signUp(validData)).rejects.toThrow(ConflictError);
    });

    it('should throw AuthenticationError for other auth errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Password is too weak' },
      });

      await expect(service.signUp(validData)).rejects.toThrow(AuthenticationError);
    });

    it('should throw ServerError if authData.user is missing but no error was thrown', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      await expect(service.signUp(validData)).rejects.toThrow('Failed to create user');
    });

    it('should console.error if profile creation fails but still return auth user', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'a@b.c' }, session: { access_token: 'token123' } },
        error: null,
      });
      mockAdminClient.insert.mockResolvedValueOnce({ error: { message: 'DB Error' } });

      const result = await service.signUp(validData);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create user profile:', { message: 'DB Error' });
      expect(result.user.id).toBe('u1');
      consoleSpy.mockRestore();
    });

    it('should wrap other unknown errors in ServerError', async () => {
      mockSupabase.auth.signUp.mockRejectedValueOnce(new Error('Network Fail'));
      await expect(service.signUp(validData)).rejects.toThrow(ServerError);
    });
  });

  describe('signIn', () => {
    const validData = { email: 'a@b.c', password: '123' };

    it('should successfully sign in', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'a@b.c' }, session: { access_token: 'token123' } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          username: 'admin_user',
          name: 'Full Name',
          role: 'admin',
          approval_status: 'approved',
          is_active: true,
        },
        error: null,
      });

      const result = await service.signIn(validData);

      expect(result.token).toBe('token123');
      expect(result.user.name).toBe('Full Name');
      expect(result.user.role).toBe('admin');
    });

    it('should throw AuthenticationError if profile fetch fails', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'a@b.c' }, session: { access_token: 'token123' } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }); // getUserById fails

      await expect(service.signIn(validData)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(service.signIn(validData)).rejects.toThrow(AuthenticationError);
    });

    it('should throw ServerError if authData.user or session is missing without error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'u1' }, session: null }, // Valid user, missing session
        error: null,
      });

      await expect(service.signIn(validData)).rejects.toThrow('Failed to authenticate');
    });

    it('should wrap unknown errors in ServerError unless it is AuthenticationError', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('DB connection dead'));
      await expect(service.signIn(validData)).rejects.toThrow(ServerError);
    });
  });

  describe('signInWithPhone', () => {
    it('should delegate phone identifier to signIn', async () => {
      const signInSpy = vi.spyOn(service, 'signIn').mockResolvedValueOnce({ token: '123' } as any);

      const result = await service.signInWithPhone('0987654321', 'password');

      expect(signInSpy).toHaveBeenCalledWith({ identifier: '0987654321', password: 'password' });
      expect(result.token).toBe('123');
    });

    it('should throw AuthenticationError if phone not found', async () => {
      mockAdminClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      await expect(service.signInWithPhone('000', '123')).rejects.toThrow('Invalid username/phone or password');
    });
  });

  describe('getSession & getCurrentUser', () => {
    it('getSession should return active session', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { access_token: '123' } },
        error: null,
      });
      const result = await service.getSession();
      expect(result.access_token).toBe('123');
    });

    it('getSession should throw if no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });
      await expect(service.getSession()).rejects.toThrow('No active session');
    });

    it('getCurrentUser should combine session user and profile data', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'u1', email: 'a@c', user_metadata: { name: 'Meta Name' } } } },
        error: null,
      });
      // getUserById fallback
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'NotFound' } });

      const result = await service.getCurrentUser();
      expect(result.name).toBe('Meta Name');
      expect(result.role).toBe('member');
    });

    it('getCurrentUser should fallback to profile email if session email missing', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'u1', email: undefined } } }, // undefined to match type string | undefined
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: { email: 'prof@email.com', role: 'admin' }, error: null });

      const result = await service.getCurrentUser();
      expect(result.email).toBe('prof@email.com');
    });

    it('getCurrentUser should fallback to empty string if both emails missing', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'u1', email: undefined } } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: { email: undefined, role: 'admin' }, error: null });

      const result = await service.getCurrentUser();
      expect(result.email).toBe('');
    });
  });

  describe('refreshSession & signOut', () => {
    it('refreshSession should return refreshed session', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValueOnce({
        data: { session: { new_token: '456' } },
        error: null,
      });
      const result = await service.refreshSession();
      expect(result.new_token).toBe('456');
    });

    it('refreshSession should throw if failed', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Expired' },
      });
      await expect(service.refreshSession()).rejects.toThrow('Failed to refresh session');
    });

    it('signOut should clear session', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
      await service.signOut();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('signOut should throw ServerError if it fails', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: { message: 'Network failed' } });
      await expect(service.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('createAuthService', () => {
    it('should initialize supabase client and return service instance', async () => {
      vi.mocked(supabaseModule.createServerSupabaseClient).mockResolvedValueOnce(mockSupabase as any);
      const srv = await createAuthService();
      expect(srv).toBeInstanceOf(AuthService);
      expect(supabaseModule.createServerSupabaseClient).toHaveBeenCalled();
    });
  });
});
