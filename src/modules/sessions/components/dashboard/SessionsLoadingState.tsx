export function SessionsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-4 w-64" />
      <div className="space-y-3 mt-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="skeleton h-16" />
        ))}
      </div>
    </div>
  );
}
