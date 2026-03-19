export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const commonNavItems: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "home" },
  { href: "/dashboard/my-account", label: "Cá nhân", icon: "user" },
  { href: "/dashboard/members", label: "Thành viên", icon: "users" },
  { href: "/dashboard/months", label: "Kỳ quản lý", icon: "calendar" },
  { href: "/dashboard/sessions", label: "Buổi tập", icon: "clipboard" },
  { href: "/dashboard/settlements", label: "Quyết toán", icon: "wallet" },
  { href: "/dashboard/events", label: "Sự kiện", icon: "star" },
  { href: "/dashboard/videos", label: "Video", icon: "play" },
];

const commonBottomTabs: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "home" },
  { href: "/dashboard/months", label: "Kỳ", icon: "calendar" },
  { href: "/dashboard/settlements", label: "Quyết toán", icon: "wallet" },
  { href: "/dashboard/my-account", label: "Cá nhân", icon: "user" },
];

export function getNavItemsByRole(_role?: string): NavItem[] {
  return commonNavItems;
}

export function getBottomTabsByRole(_role?: string): NavItem[] {
  return commonBottomTabs;
}
