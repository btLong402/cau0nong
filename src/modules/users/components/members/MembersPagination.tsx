interface MembersPaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MembersPagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: MembersPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        disabled={page === 1}
        onClick={onPrev}
        className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Trước
      </button>
      <span className="px-4 py-2 text-sm text-[var(--muted)]">
        Trang {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={onNext}
        className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sau
      </button>
    </div>
  );
}
