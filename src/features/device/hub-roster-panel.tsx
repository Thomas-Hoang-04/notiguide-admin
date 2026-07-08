"use client";

import { Loader2, Radio, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RosterReceiver } from "@/lib/serial/types";
import type { UseSerialReturn } from "@/lib/serial/use-serial";
import { relayRoster } from "./api";

interface HubRosterPanelProps {
  serial: UseSerialReturn;
  /** Backend device id of the connected hub — target of the roster relay. */
  deviceId: string;
}

export function HubRosterPanel({ serial, deviceId }: HubRosterPanelProps) {
  const tRoster = useTranslations("devices.usb.roster");
  const tUsb = useTranslations("devices.usb");
  const tCommon = useTranslations("common");

  const { sendCommand, events } = serial;

  const [receivers, setReceivers] = useState<RosterReceiver[]>([]);
  const [maxSlots, setMaxSlots] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pairingDisabled, setPairingDisabled] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RosterReceiver | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRoster = useCallback(async () => {
    try {
      const result = await sendCommand("roster.list");
      setReceivers(result.receivers);
      setMaxSlots(result.max);
      setPairingDisabled(false);

      // Redundant roster sync (hub → Web Serial → backend): mirrors the MQTT
      // roster-sync path so receivers paired while the hub is offline reach the
      // backend as soon as an admin views the roster over USB. The seq keeps it
      // idempotent server-side; older firmware without seq is skipped. Failures
      // are silent — MQTT sync remains the primary road.
      if (result.seq != null) {
        void relayRoster(deviceId, {
          seq: result.seq,
          receivers: result.receivers.map((rx) => ({
            slot: rx.slot,
            band: rx.band,
            label: rx.name || null,
          })),
        }).catch(() => {});
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("pairing_disabled")) {
        setPairingDisabled(true);
      }
    } finally {
      setLoading(false);
    }
  }, [sendCommand, deviceId]);

  useEffect(() => {
    void fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    const handler = () => {
      void fetchRoster();
    };
    events.addEventListener("event.roster_changed", handler);
    return () => events.removeEventListener("event.roster_changed", handler);
  }, [events, fetchRoster]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const result = await sendCommand("roster.unpair", {
        slot: deleteTarget.slot,
      });
      toast.success(
        tRoster("removed", {
          name: result.removed_name,
          slot: String(result.slot),
        }),
      );
      setDeleteTarget(null);
      await fetchRoster();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tUsb("command_failed"));
    } finally {
      setDeleteLoading(false);
    }
  }

  function formatPairedAt(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "—";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  if (pairingDisabled || loading) return null;

  return (
    <>
      <Card className="rounded-lg p-3">
        <div className="mb-2 flex items-center gap-2">
          <Radio aria-hidden="true" className="size-4 text-primary" />
          <span className="text-sm font-medium">
            {tRoster("title")} ({receivers.length}/{maxSlots})
          </span>
        </div>

        {receivers.length === 0 ? (
          <p className="text-xs text-muted-foreground">{tRoster("empty")}</p>
        ) : (
          <div className="space-y-1.5">
            {receivers.map((rx) => (
              <div
                key={rx.slot}
                className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-1.5 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-muted-foreground">
                    #{rx.slot}
                  </span>
                  <span className="font-medium">{rx.name || "—"}</span>
                  <span className="text-muted-foreground">{rx.band}</span>
                  <span className="text-muted-foreground">
                    {rx.mac.slice(0, 8)}...
                  </span>
                  <span className="text-muted-foreground">
                    {tRoster("paired")}: {formatPairedAt(rx.paired_at_ms)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(rx)}
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">{tRoster("delete")}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tRoster("confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                tRoster("confirm_desc", {
                  name: deleteTarget.name || `Slot ${deleteTarget.slot}`,
                  slot: String(deleteTarget.slot),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              {deleteLoading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tRoster("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
