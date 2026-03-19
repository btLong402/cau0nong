import { FormEvent } from "react";

import { CreateMemberFormData } from "@/modules/users/types";
import { AddMemberModalFields } from "@/modules/users/components/members/AddMemberModalFields";

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
          <AddMemberModalFields formData={formData} onFieldChange={onFieldChange} />

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
