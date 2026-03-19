interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
  alt,
}: UserAvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const sizeClass =
    size === "xs" ? "h-6 w-6 text-[10px]" :
    size === "sm" ? "h-8 w-8 text-xs" :
    size === "lg" ? "h-12 w-12 text-base" :
    size === "xl" ? "h-16 w-16 text-xl" :
    "h-10 w-10 text-sm";

  const combinedClass = `${sizeClass} rounded-full object-cover transition-colors ${className}`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt || `Avatar của ${name}`}
        className={`${combinedClass} border border-[var(--surface-border)]`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${combinedClass} flex items-center justify-center font-bold`}
    >
      {initial}
    </div>
  );
}
