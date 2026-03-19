export function EventsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-4 w-56" />
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="skeleton h-28" />
        ))}
      </div>
    </div>
  );
}
