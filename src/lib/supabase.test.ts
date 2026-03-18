import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient, createServerSupabaseClient } from './supabase';
import * as ssr from '@supabase/ssr';
import * as nextHeaders from 'next/headers';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Supabase Clients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  describe('createClient', () => {
    it('should call createBrowserClient with environment variables', () => {
      createClient();
      expect(ssr.createBrowserClient).toHaveBeenCalledWith(
        'http://localhost',
        'anon-key'
      );
    });
  });

  describe('createServerSupabaseClient', () => {
    const mockAuthSetSession = vi.fn();
    
    beforeEach(() => {
      vi.mocked(ssr.createServerClient).mockReturnValue({
        auth: { setSession: mockAuthSetSession },
      } as any);
    });

    it('should retrieve cookies via next/headers and not set session if no auth_token', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([{ name: 'test', value: '123' }]),
        set: vi.fn(),
        get: vi.fn().mockReturnValue(undefined), // No auth_token
      };

      vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

      const client = await createServerSupabaseClient();
      expect(ssr.createServerClient).toHaveBeenCalled();
      
      // Test the getAll method passed to createServerClient config
      const options = vi.mocked(ssr.createServerClient).mock.calls[0][2];
      const allCookies = options.cookies!.getAll!();
      
      expect(mockCookieStore.getAll).toHaveBeenCalled();
      expect(allCookies).toEqual([{ name: 'test', value: '123' }]);
      
      expect(mockAuthSetSession).not.toHaveBeenCalled();
    });

    it('should manually set session if custom auth_token exists', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
        get: vi.fn((name) => {
          if (name === 'auth_token') return { value: 'custom-jwt-token' };
          return undefined;
        }),
      };

      vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

      await createServerSupabaseClient();

      expect(mockAuthSetSession).toHaveBeenCalledWith({
        access_token: 'custom-jwt-token',
        refresh_token: '',
      });
    });

    it('should implement setAll to set cookies', async () => {
      const mockCookieStore = {
        getAll: vi.fn(),
        set: vi.fn(),
        get: vi.fn(),
      };

      vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

      await createServerSupabaseClient();
      const options = vi.mocked(ssr.createServerClient).mock.calls[0][2];
      
      // Call the setAll implementation
      options.cookies!.setAll!([
        { name: 'cookie1', value: 'val1', options: { path: '/' } },
        { name: 'cookie2', value: 'val2', options: {} }
      ]);

      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(1, 'cookie1', 'val1', { path: '/' });
      expect(mockCookieStore.set).toHaveBeenNthCalledWith(2, 'cookie2', 'val2', {});
    });

    it('should catch errors when setAll fails in Server Components', async () => {
      const mockCookieStore = {
        getAll: vi.fn(),
        set: vi.fn().mockImplementation(() => {
          throw new Error('Cannot set cookies in Server Component');
        }),
        get: vi.fn(),
      };

      vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

      await createServerSupabaseClient();
      const options = vi.mocked(ssr.createServerClient).mock.calls[0][2];
      
      // Should not throw Error, should be caught
      expect(() => {
        options.cookies!.setAll!([{ name: 'cookie1', value: 'val1', options: {} }]);
      }).not.toThrow();
    });
  });
});
