export function MembersLoadingState() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-4 w-72" />
      <div className="space-y-3 mt-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="skeleton h-16" />
        ))}
      </div>
    </div>
  );
}
