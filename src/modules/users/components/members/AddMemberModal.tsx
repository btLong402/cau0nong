import { FormEvent } from "react";

import { CreateMemberFormData } from "@/modules/users/types";

interface AddMemberModalProps {
  isOpen: boolean;
  error: string | null;
  isSubmitting: boolean;
  formData: CreateMemberFormData;
  onClose: () => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFieldChange: (field: keyof CreateMemberFormData, value: string) => void;
}

export function AddMemberModal({
  isOpen,
  error,
  isSubmitting,
  formData,
  onClose,
  onSubmit,
  onFieldChange,
}: AddMemberModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="surface-card max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold">Thêm thành viên mới</h2>

        {error && (
          <div className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] text-sm rounded-md border border-[var(--danger)]">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">
              Username
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.username}
              onChange={(event) => onFieldChange("username", event.target.value)}
              placeholder="nguyenvana"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">
              Họ tên
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">
                Email
              </label>
              <input
                type="email"
                required
                className="input-field"
                value={formData.email}
                onChange={(event) => onFieldChange("email", event.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">
                Số điện thoại
              </label>
              <input
                type="tel"
                required
                className="input-field"
                value={formData.phone}
                onChange={(event) => onFieldChange("phone", event.target.value)}
                placeholder="09xxx..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">
              Mật khẩu (mặc định: 123456)
            </label>
            <input
              type="password"
              className="input-field"
              value={formData.password}
              onChange={(event) => onFieldChange("password", event.target.value)}
              placeholder="Để trống nếu dùng mặc định"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">
              Vai trò
            </label>
            <select
              className="input-field"
              value={formData.role}
              onChange={(event) => onFieldChange("role", event.target.value)}
            >
              <option value="member">Thành viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? "Đang tạo..." : "Tạo thành viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
