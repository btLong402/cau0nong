interface MyAccountErrorStateProps {
  error: string | null;
}

export function MyAccountErrorState({ error }: MyAccountErrorStateProps) {
  return (
    <div className="surface-card p-6 text-center border-l-4 border-l-[var(--danger)]">
      <p className="text-[var(--danger)]">{error || "Không thể tải dữ liệu"}</p>
    </div>
  );
}
