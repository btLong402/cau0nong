interface SessionsHeaderProps {
  canCreate: boolean;
  onToggleCreate: () => void;
}

export function SessionsHeader({ canCreate, onToggleCreate }: SessionsHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">Buổi tập</h1>
        <p className="page-subtitle">Quản lý danh sách buổi tập và thông tin điểm danh.</p>
      </div>
      {canCreate && (
        <button onClick={onToggleCreate} className="btn-primary">
          Thêm buổi tập
        </button>
      )}
    </div>
  );
}
