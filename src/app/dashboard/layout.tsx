"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/shared/hooks";

import {
  DashboardBottomNav,
  DashboardMobileDrawer,
  DashboardSidebar,
  getBottomTabsByRole,
  getNavItemsByRole,
} from "./_components";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const fromPath = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
      router.replace(`/login?from=${encodeURIComponent(fromPath)}`);
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = getNavItemsByRole(user.role);
  const bottomTabs = getBottomTabsByRole(user.role);
  const bottomTabHrefs = new Set(bottomTabs.map((tab) => tab.href));
  const drawerItems = navItems.filter((item) => !bottomTabHrefs.has(item.href));
  const userName = user.name || user.email;

  return (
    <div className="app-shell min-h-screen">
      <DashboardSidebar
        navItems={navItems}
        isActive={isActive}
        userName={userName}
        userRole={user.role}
        avatarUrl={user.avatar_url}
        onLogout={handleLogout}
      />

      <main className="lg:ml-[var(--sidebar-width)]">
        <div className="mx-auto max-w-[1200px] px-4 py-4 pb-24 md:px-6 md:py-6 lg:pb-6">{children}</div>
      </main>

      <DashboardBottomNav
        tabs={bottomTabs}
        hasMenu={drawerItems.length > 0}
        drawerOpen={drawerOpen}
        isActive={isActive}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      <DashboardMobileDrawer
        open={drawerOpen}
        drawerItems={drawerItems}
        userName={userName}
        userRole={user.role}
        avatarUrl={user.avatar_url}
        isActive={isActive}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  );
}
