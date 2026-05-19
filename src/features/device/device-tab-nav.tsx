"use client";

import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type DeviceTab = "all" | "pending" | "tokens";

const TABS: {
  key: DeviceTab;
  href: string;
  labelKey: "allTab" | "pendingTab" | "tokensTab";
}[] = [
  { key: "all", href: "/dashboard/devices", labelKey: "allTab" },
  {
    key: "pending",
    href: "/dashboard/devices/pending",
    labelKey: "pendingTab",
  },
  {
    key: "tokens",
    href: "/dashboard/devices/tokens",
    labelKey: "tokensTab",
  },
];

interface DeviceTabNavProps {
  active: DeviceTab;
}

export function DeviceTabNav({ active }: DeviceTabNavProps) {
  const tDevices = useTranslations("devices");

  return (
    <div className="glass-panel flex flex-wrap gap-1 rounded-xl p-1.5">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            buttonVariants({
              variant: tab.key === active ? "default" : "ghost",
              size: "sm",
            }),
            tab.key !== active && "text-muted-foreground",
          )}
        >
          {tDevices(tab.labelKey)}
        </Link>
      ))}
    </div>
  );
}
