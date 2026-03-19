interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}

export function UserAvatar({ name, avatarUrl, size = "md" }: UserAvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar của ${name}`}
        className={`${sizeClass} rounded-full object-cover border border-[var(--surface-border)]`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-[var(--primary-soft)] font-bold text-[var(--primary)]`}
    >
      {initial}
    </div>
  );
}
