interface EventsErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function EventsErrorState({ error, onRetry }: EventsErrorStateProps) {
  return (
    <div className="empty-state">
      <svg
        className="empty-state-icon text-[var(--danger)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <p className="empty-state-title text-[var(--danger)]">{error}</p>
      <button onClick={onRetry} className="btn-primary mt-4">
        Thử lại
      </button>
    </div>
  );
}
