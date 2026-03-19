import { createAdminClient } from "@/lib/supabase";
import { AuthenticationError } from "@/shared/api";

import { LoginProfile, UserProfilePayload } from "./auth.types";

export async function createUserProfile(
  adminClient: any,
  profile: UserProfilePayload,
): Promise<void> {
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
  }
}

export async function getUserById(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function resolveEmailForLogin(identifier: string): Promise<string> {
  if (identifier.includes("@")) {
    return identifier.trim().toLowerCase();
  }

  const normalized = identifier.trim().toLowerCase();
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

export function assertAccountCanLogin(
  profile: unknown,
  signOut: () => Promise<{ error: null | unknown }> | Promise<void> | void,
): asserts profile is LoginProfile {
  if (!profile) {
    throw new AuthenticationError("Account profile not found");
  }

  const profileData = profile as {
    approval_status?: "pending" | "approved" | "rejected";
    is_active?: boolean;
  };

  if (profileData.approval_status === "pending") {
    void signOut();
    throw new AuthenticationError("Tài khoản đang chờ admin duyệt");
  }

  if (profileData.approval_status === "rejected") {
    void signOut();
    throw new AuthenticationError("Tài khoản đã bị từ chối. Vui lòng liên hệ admin");
  }

  if (!profileData.is_active) {
    void signOut();
    throw new AuthenticationError("Tài khoản đã bị vô hiệu hóa");
  }
}
