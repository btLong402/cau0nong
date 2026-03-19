export function MyAccountLoadingState() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-4 w-56" />
      <div className="skeleton h-32 mt-4" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="skeleton h-24" />
        ))}
      </div>
    </div>
  );
}
