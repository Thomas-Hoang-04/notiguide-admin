"use client";

import { AlertTriangle, Loader2, Usb } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { UseSerialReturn } from "@/lib/serial/use-serial";

/**
 * USB connect / status control for the Queue page. Lets an admin establish or
 * inspect the local Web Serial hub connection that powers serial-fallback and
 * offline dispatch. When a hub is connected but not usable (wrong device kind
 * or not activated), it surfaces the reason so a disabled dispatch is not silent.
 */
export function QueueSerialControl({ serial }: { serial: UseSerialReturn }) {
  const tQueue = useTranslations("queue");
  const tUsb = useTranslations("devices.usb");

  if (!serial.canUseSerial) return null;

  const { portState, deviceKind, deviceState, identifyPayload } = serial;

  if (portState === "opening" || portState === "closing") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" />
        <span>{tUsb("connect")}…</span>
      </div>
    );
  }

  if (portState === "closed") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
        <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Usb aria-hidden="true" className="size-4 shrink-0" />
          {tQueue("dispatch.serial.connectHint")}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void serial.connect().catch(() => {})}
        >
          <Usb aria-hidden="true" className="mr-1.5 size-4" />
          {tUsb("connect")}
        </Button>
      </div>
    );
  }

  const isHub = deviceKind === "TRANSMITTER_HUB";
  const isActive = deviceState?.op_state === "ACTIVE";

  if (isHub && isActive) {
    const name = identifyPayload?.device_name;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 px-3.5 py-3 text-success dark:border-success/50 dark:bg-success/15">
        <span className="flex items-center gap-2.5 text-sm">
          <Usb aria-hidden="true" className="size-4 shrink-0" />
          {name
            ? `${tQueue("dispatch.serial.connected")} · ${name}`
            : tQueue("dispatch.serial.connected")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void serial.disconnect()}
        >
          {tUsb("disconnect")}
        </Button>
      </div>
    );
  }

  const reason = isHub
    ? tQueue("dispatch.serial.hubInactive")
    : tQueue("dispatch.serial.notHub");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/15 px-3.5 py-3 text-warning dark:border-warning/50 dark:bg-warning/20">
      <span className="flex items-center gap-2.5 text-sm">
        <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
        {reason}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void serial.disconnect()}
      >
        {tUsb("disconnect")}
      </Button>
    </div>
  );
}
