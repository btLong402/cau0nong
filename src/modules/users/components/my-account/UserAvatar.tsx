import { UserProfile } from "@modules/users/types";

interface UserAvatarProps {
  profile: Pick<UserProfile, "name" | "avatar_url">;
  size?: "sm" | "md";
  srcOverride?: string | null;
  alt?: string;
}

const avatarClassMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-lg",
};

export function UserAvatar({
  profile,
  size = "md",
  srcOverride,
  alt,
}: UserAvatarProps) {
  const src = srcOverride ?? profile.avatar_url;
  const sizeClass = avatarClassMap[size];
  const displayName = profile.name?.trim() || "Người dùng";
  const displayInitial = displayName.charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={alt || `Avatar của ${displayName}`}
        className={`${sizeClass} rounded-full object-cover border border-[var(--surface-border)]`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-[var(--primary-soft)] font-bold text-[var(--primary)]`}
    >
      {displayInitial}
    </div>
  );
}
