import { CustomSelect } from "@/shared/components/CustomSelect";

interface NewSessionFormProps {
  visible: boolean;
  formError: string;
  sessionDate: string;
  courtExpense: string;
  payerUserId: string;
  notes: string;
  users: Array<{ id: string; name: string }>;
  creating: boolean;
  creatingSession: boolean;
  onSessionDateChange: (value: string) => void;
  onCourtExpenseChange: (value: string) => void;
  onPayerUserIdChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCreate: () => Promise<void>;
  onCancel: () => void;
}

export function NewSessionForm({
  visible,
  formError,
  sessionDate,
  courtExpense,
  payerUserId,
  notes,
  users,
  creating,
  creatingSession,
  onSessionDateChange,
  onCourtExpenseChange,
  onPayerUserIdChange,
  onNotesChange,
  onCreate,
  onCancel,
}: NewSessionFormProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="surface-card-soft p-5">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Tạo buổi tập mới</h2>
      {formError && (
        <div className="mt-3 surface-card p-3 border-l-4 border-l-[var(--danger)]">
          <p className="text-sm text-[var(--danger)]">{formError}</p>
        </div>
      )}
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Ngày *</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(event) => onSessionDateChange(event.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Chi phí sân (đ) *
            </label>
            <input
              type="number"
              placeholder="200000"
              value={courtExpense}
              onChange={(event) => onCourtExpenseChange(event.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomSelect
            label="Người ứng tiền *"
            value={payerUserId}
            onChange={onPayerUserIdChange}
            options={users.map((user) => ({
              value: user.id,
              label: user.name,
            }))}
            placeholder="Chọn thành viên"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Ghi chú</label>
            <input
              type="text"
              placeholder="Ứng tiền sân..."
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onCreate} disabled={creating || creatingSession} className="btn-primary flex-1">
            {creating || creatingSession ? "Đang tạo..." : "Tạo"}
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
