"use client";

import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings,
  ShieldCheck,
  Store,
  Ticket,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { LogoutConfirmDialog } from "./logout-confirm-dialog";
import "@/styles/sidebar.css";

interface NavItem {
  href: string;
  label:
    | "overview"
    | "queue"
    | "analytics"
    | "stores"
    | "admins"
    | "devices"
    | "settings";
  icon: React.ReactNode;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "overview",
    icon: <LayoutDashboard aria-hidden="true" className="size-5" />,
  },
  {
    href: "/dashboard/queue",
    label: "queue",
    icon: <Ticket aria-hidden="true" className="size-5" />,
    adminOnly: true,
  },
  {
    href: "/dashboard/analytics",
    label: "analytics",
    icon: <BarChart3 aria-hidden="true" className="size-5" />,
  },
  {
    href: "/dashboard/stores",
    label: "stores",
    icon: <Store aria-hidden="true" className="size-5" />,
    superAdminOnly: true,
  },
  {
    href: "/dashboard/admins",
    label: "admins",
    icon: <ShieldCheck aria-hidden="true" className="size-5" />,
  },
  {
    href: "/dashboard/devices",
    label: "devices",
    icon: <Radio aria-hidden="true" className="size-5" />,
  },
  {
    href: "/dashboard/settings",
    label: "settings",
    icon: <Settings aria-hidden="true" className="size-5" />,
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const tNavigation = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const { isSuperAdmin } = useAuthStore();

  const translatedNavItems = navItems.map((item) => ({
    ...item,
    label: tNavigation(item.label),
  }));

  const visibleItems = translatedNavItems.filter(
    (item) =>
      (!item.superAdminOnly || isSuperAdmin) &&
      (!item.adminOnly || !isSuperAdmin),
  );

  return (
    <aside
      className={cn(
        "sidebar flex h-screen w-56 flex-col 3xl:w-64",
        onNavigate && "sidebar-mobile",
      )}
    >
      {onNavigate && (
        <div className="flex justify-start px-4 py-5">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onNavigate}
            className="text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
            aria-label={tCommon("close")}
          >
            <X aria-hidden="true" className="size-6" />
          </Button>
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-2.5 px-6",
          onNavigate ? "pt-1" : "h-16 pt-5",
        )}
      >
        <Ticket aria-hidden="true" className="size-8 text-sidebar-primary" />
        <span className="text-xl font-bold text-sidebar-primary">
          {tCommon("appName")}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", isActive && "sidebar-link-active")}
              onClick={onNavigate}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/20 p-3">
        <LogoutConfirmDialog
          trigger={
            <button
              type="button"
              className="sidebar-link sidebar-logout w-full text-left"
            />
          }
        >
          <LogOut aria-hidden="true" className="size-5" />
          {tNavigation("logout")}
        </LogoutConfirmDialog>
      </div>
    </aside>
  );
}
