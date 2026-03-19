import Link from "next/link";

import { NavIcon } from "./NavIcon";
import { NavItem } from "./nav-config";
import { UserAvatar } from "./UserAvatar";

interface DashboardSidebarProps {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
  onLogout: () => Promise<void>;
}

export function DashboardSidebar({
  navItems,
  isActive,
  userName,
  userRole,
  avatarUrl,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[var(--sidebar-width)] flex-col border-r border-[var(--surface-border)] bg-[var(--surface)] lg:flex">
      <Link
        href="/dashboard"
        className="block border-b border-[var(--surface-border)] px-5 py-5 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
            <img src="/favicon.svg" alt="CLB Logo" className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--foreground)]">CLB Cầu Lông</p>
            <p className="truncate text-xs text-[var(--muted)]">Quản lý vận hành</p>
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-nav-item ${isActive(item.href) ? "active" : ""}`}
          >
            <NavIcon name={item.icon} className="h-5 w-5 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[var(--surface-border)] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-[var(--surface-hover)] p-3">
          <UserAvatar name={userName} avatarUrl={avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{userName}</p>
            <p className="text-xs text-[var(--muted)]">
              {userRole === "admin" ? "Quản trị viên" : "Thành viên"}
            </p>
          </div>
        </div>
        <button
          onClick={() => void onLogout()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--danger-soft)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)] cursor-pointer"
        >
          <NavIcon name="logout" className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
