import { MyAccountDashboardData } from "@modules/users/types";

interface AvatarResponse {
  data?: {
    avatar_url?: string | null;
  };
  error?: {
    message?: string;
  };
}

interface UpdateProfileResponse {
  data?: {
    user?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  error?: {
    message?: string;
  };
}

interface DashboardResponse {
  data: MyAccountDashboardData;
}

function ensureSuccess(response: Response, errorMessage?: string): void {
  if (!response.ok) {
    throw new Error(errorMessage || "Yeu cau that bai.");
  }
}

export async function fetchMyAccountDashboard(): Promise<MyAccountDashboardData> {
  const response = await fetch("/api/me/dashboard", { cache: "no-store" });
  ensureSuccess(response, "Failed to load dashboard");

  const payload = (await response.json()) as DashboardResponse;
  return payload.data;
}

export async function uploadMyAvatar(file: File): Promise<string | null> {
  const body = new FormData();
  body.append("avatar", file);

  const response = await fetch("/api/me/avatar", {
    method: "POST",
    credentials: "include",
    body,
  });

  const payload = (await response.json()) as AvatarResponse;
  ensureSuccess(response, payload.error?.message || "Không thể cập nhật avatar.");

  return payload.data?.avatar_url || null;
}

export async function updateMyProfile(input: {
  name: string;
  phone: string;
}): Promise<{ name: string; phone: string; email?: string }> {
  const response = await fetch("/api/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as UpdateProfileResponse;
  ensureSuccess(response, payload.error?.message || "Không thể cập nhật thông tin.");

  if (!payload.data?.user) {
    throw new Error("Khong nhan duoc thong tin nguoi dung da cap nhat.");
  }

  return payload.data.user;
}

export async function removeMyAvatar(): Promise<void> {
  const response = await fetch("/api/me/avatar", {
    method: "DELETE",
    credentials: "include",
  });

  const payload = (await response.json()) as AvatarResponse;
  ensureSuccess(response, payload.error?.message || "Không thể xóa avatar.");
}
