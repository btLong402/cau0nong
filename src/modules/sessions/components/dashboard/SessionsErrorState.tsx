export function SessionsErrorState() {
  return (
    <div className="surface-card p-5 border-l-4 border-l-[var(--danger)]">
      <p className="text-sm text-[var(--danger)]">
        Không thể tải dữ liệu buổi tập. Vui lòng thử lại.
      </p>
    </div>
  );
}
