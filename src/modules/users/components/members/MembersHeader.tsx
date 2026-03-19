interface MembersHeaderProps {
  isAdmin: boolean;
  onAddMember: () => void;
}

export function MembersHeader({ isAdmin, onAddMember }: MembersHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">Quản lý thành viên</h1>
        <p className="page-subtitle">Danh sách thành viên và trạng thái tài khoản.</p>
      </div>

      {isAdmin && (
        <button onClick={onAddMember} className="btn-primary">
          Thêm thành viên
        </button>
      )}
    </div>
  );
}
