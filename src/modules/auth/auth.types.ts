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

export interface UserProfilePayload {
  id: string;
  username: string;
  email: string;
  name: string;
  phone: string;
  role: "admin" | "member";
  approval_status: "pending" | "approved" | "rejected";
  is_active: boolean;
}

export interface LoginProfile {
  username: string;
  approval_status: "pending" | "approved" | "rejected";
  is_active: boolean;
  name?: string;
  role: "admin" | "member";
}
