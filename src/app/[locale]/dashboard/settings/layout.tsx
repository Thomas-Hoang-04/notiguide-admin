"use client";

import {
  Building2,
  KeyRound,
  Link2,
  ListOrdered,
  Shield,
  Store,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tSettings = useTranslations("settings");
  const { isSuperAdmin } = useAuthStore();

  const settingsTabs = [
    {
      href: "/dashboard/settings/account",
      label: "accountTab" as const,
      icon: User,
    },
    {
      href: "/dashboard/settings/password",
      label: "passwordTab" as const,
      icon: KeyRound,
    },
    ...(!isSuperAdmin
      ? [
          {
            href: "/dashboard/settings/store",
            label: "storeTab" as const,
            icon: Store,
          },
          {
            href: "/dashboard/settings/service-types",
            label: "serviceTypesTab" as const,
            icon: ListOrdered,
          },
          {
            href: "/dashboard/settings/slugs",
            label: "slugsTab" as const,
            icon: Link2,
          },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          {
            href: "/dashboard/settings/organization",
            label: "organizationTab" as const,
            icon: Building2,
          },
        ]
      : []),
    {
      href: "/dashboard/settings/security",
      label: "securityTab" as const,
      icon: Shield,
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold l:mb-6 l:text-2xl">
        {tSettings("title")}
      </h1>

      <nav className="mb-4 flex gap-1 border-b border-border l:mb-6">
        {settingsTabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="size-4" />
              {tSettings(tab.label)}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
