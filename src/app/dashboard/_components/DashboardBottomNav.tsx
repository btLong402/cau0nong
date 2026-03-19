import Link from "next/link";

import { NavIcon } from "./NavIcon";
import { NavItem } from "./nav-config";

interface DashboardBottomNavProps {
  tabs: NavItem[];
  hasMenu: boolean;
  drawerOpen: boolean;
  isActive: (href: string) => boolean;
  onOpenMenu: () => void;
}

export function DashboardBottomNav({
  tabs,
  hasMenu,
  drawerOpen,
  isActive,
  onOpenMenu,
}: DashboardBottomNavProps) {
  return (
    <nav className="bottom-nav lg:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`bottom-nav-item ${isActive(tab.href) ? "active" : ""}`}
        >
          <NavIcon name={tab.icon} />
          <span>{tab.label}</span>
        </Link>
      ))}

      {hasMenu && (
        <button onClick={onOpenMenu} className={`bottom-nav-item ${drawerOpen ? "active" : ""}`}>
          <NavIcon name="menu" />
          <span>Menu</span>
        </button>
      )}
    </nav>
  );
}
