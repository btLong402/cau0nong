interface EventsHeaderProps {
  onCreateEvent: () => void;
}

export function EventsHeader({ onCreateEvent }: EventsHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">Sự kiện</h1>
        <p className="page-subtitle">Quản lý sự kiện, giải đấu và liên hoan.</p>
      </div>
      <button onClick={onCreateEvent} className="btn-primary">
        Tạo sự kiện
      </button>
    </div>
  );
}
