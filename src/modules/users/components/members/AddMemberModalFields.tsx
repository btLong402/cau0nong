import { CreateMemberFormData } from "@/modules/users/types";

interface AddMemberModalFieldsProps {
  formData: CreateMemberFormData;
  onFieldChange: (field: keyof CreateMemberFormData, value: string) => void;
}

export function AddMemberModalFields({
  formData,
  onFieldChange,
}: AddMemberModalFieldsProps) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Username</label>
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
        <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Họ tên</label>
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
          <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Email</label>
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
        <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Vai trò</label>
        <select
          className="input-field"
          value={formData.role}
          onChange={(event) => onFieldChange("role", event.target.value)}
        >
          <option value="member">Thành viên</option>
          <option value="admin">Quản trị viên</option>
        </select>
      </div>
    </>
  );
}
