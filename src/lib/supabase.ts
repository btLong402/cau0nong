import { createBrowserClient } from "@supabase/ssr";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser/Client side Supabase client
 * Used in Client Components for real-time subscriptions, mutations
 */
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Server side Supabase client
 * Used in Server Components, API Routes, Server Actions
 * Automatically handles session from cookies
 */
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  const client = createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });

  // Manually set session if our custom auth_token exists
  const customToken = cookieStore.get("auth_token")?.value;
  if (customToken) {
    await client.auth.setSession({
      access_token: customToken,
      refresh_token: "", // We don't store refresh token in this cookie
    });
  }

  return client;
};

// Alias for backward compatibility
export const createServerClient = createServerSupabaseClient;
