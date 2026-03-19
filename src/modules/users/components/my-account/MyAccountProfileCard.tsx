import {
  MyAccountFormValues,
  UserProfile,
} from "@modules/users/types";
import { formatCurrency } from "@modules/users/lib/my-account-formatters";
import { UserAvatar } from "./UserAvatar";

interface MyAccountProfileCardProps {
  profile: UserProfile;
  isEditing: boolean;
  isSaving: boolean;
  formError: string | null;
  formSuccess: string | null;
  formValues: MyAccountFormValues;
  avatarPreviewUrl: string | null;
  avatarInputKey: number;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onAvatarFileChange: (file: File | null) => void;
  onFieldChange: (field: keyof MyAccountFormValues, value: string) => void;
}

export function MyAccountProfileCard({
  profile,
  isEditing,
  isSaving,
  formError,
  formSuccess,
  formValues,
  avatarPreviewUrl,
  avatarInputKey,
  onStartEdit,
  onCancelEdit,
  onSave,
  onRemoveAvatar,
  onAvatarFileChange,
  onFieldChange,
}: MyAccountProfileCardProps) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <UserAvatar profile={profile} size="md" />
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">{profile.name}</h2>
            <p className="text-sm text-[var(--muted)]">
              {profile.role === "admin" ? "Quản trị viên" : "Thành viên"}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button type="button" className="btn-secondary" onClick={onStartEdit}>
            Chỉnh sửa
          </button>
        )}
      </div>

      {formSuccess && <p className="mb-3 text-sm font-medium text-[var(--accent)]">{formSuccess}</p>}
      {formError && <p className="mb-3 text-sm font-medium text-[var(--danger)]">{formError}</p>}

      {!isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Số điện thoại</p>
            <p className="text-sm font-medium text-[var(--foreground)]">{profile.phone}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Email</p>
            <p className="text-sm font-medium text-[var(--foreground)]">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Số dư tài khoản</p>
            <p
              className={`text-sm font-bold ${profile.balance >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}
            >
              {formatCurrency(profile.balance)}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-[var(--muted)]">Họ và tên</span>
              <input
                type="text"
                className="input-field"
                value={formValues.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="Nhập họ và tên"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-[var(--muted)]">Số điện thoại</span>
              <input
                type="tel"
                className="input-field"
                value={formValues.phone}
                onChange={(event) => onFieldChange("phone", event.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-[var(--muted)]">Ảnh avatar</span>
              <input
                key={avatarInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="input-field"
                onChange={(event) => onAvatarFileChange(event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-[var(--muted)]">Xem trước avatar:</p>
            <UserAvatar
              profile={profile}
              size="sm"
              srcOverride={avatarPreviewUrl}
              alt="Xem trước avatar"
            />
          </div>

          <div>
            <p className="text-xs text-[var(--muted)]">Email</p>
            <p className="text-sm font-medium text-[var(--foreground)]">{profile.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            {(avatarPreviewUrl || profile.avatar_url) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onRemoveAvatar}
                disabled={isSaving}
              >
                Xóa avatar
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onCancelEdit} disabled={isSaving}>
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
