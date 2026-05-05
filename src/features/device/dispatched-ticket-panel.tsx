"use client";

import { Radio } from "lucide-react";
import { useTranslations } from "next-intl";

export function DispatchedTicketPanel() {
  const tDevices = useTranslations("devices");

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-lg font-semibold">
        {tDevices("dispatch.title")}
      </h2>
      <div className="flex items-center gap-3 text-muted-foreground">
        <Radio aria-hidden="true" className="size-5" />
        <p className="text-sm">{tDevices("dispatch.placeholder")}</p>
      </div>
    </div>
  );
}
