"use client";

import { Usb } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DispatchMode } from "@/lib/dispatch/mode";

export function DispatchModeBanner({ mode }: { mode: DispatchMode }) {
  const tQueue = useTranslations("queue");
  if (mode !== "ONLINE_SERIAL_FALLBACK" && mode !== "OFFLINE_SERIAL")
    return null;
  const key =
    mode === "OFFLINE_SERIAL"
      ? "dispatch.banner.offline"
      : "dispatch.banner.serialFallback";
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-warning/40 bg-warning/15 px-3.5 py-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/20">
      <Usb aria-hidden="true" className="size-4 shrink-0" />
      <span>{tQueue(key)}</span>
    </div>
  );
}
