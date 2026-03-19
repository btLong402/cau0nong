import Link from "next/link";

import { NavIcon } from "./NavIcon";
import { NavItem } from "./nav-config";
import { UserAvatar } from "./UserAvatar";

interface DashboardMobileDrawerProps {
  open: boolean;
  drawerItems: NavItem[];
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
  isActive: (href: string) => boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

export function DashboardMobileDrawer({
  open,
  drawerItems,
  userName,
  userRole,
  avatarUrl,
  isActive,
  onClose,
  onLogout,
}: DashboardMobileDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div className="drawer-overlay lg:hidden" onClick={onClose} />
      <div className="drawer-panel lg:hidden">
        <div className="drawer-handle" />

        <div className="flex items-center gap-3 px-5 pb-3 mb-1 border-b border-[var(--surface-border)]">
          <UserAvatar name={userName} avatarUrl={avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{userName}</p>
            <p className="text-xs text-[var(--muted)]">
              {userRole === "admin" ? "Quản trị viên" : "Thành viên"}
            </p>
          </div>
        </div>

        {drawerItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`drawer-item ${isActive(item.href) ? "active" : ""}`}
            onClick={onClose}
          >
            <NavIcon name={item.icon} className="h-5 w-5" />
            {item.label}
          </Link>
        ))}

        <div className="border-t border-[var(--surface-border)] mt-1 pt-1">
          <button onClick={() => void onLogout()} className="drawer-item text-[var(--danger)]">
            <NavIcon name="logout" className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
