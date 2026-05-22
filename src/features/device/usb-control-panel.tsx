"use client";

import { Activity, ChevronDown, Loader2, Usb } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseSerialReturn } from "@/lib/serial/use-serial";
import { relayDiagnostics } from "./api";
import { SerialConsole } from "./serial-console";

interface UsbControlPanelProps {
  serial: UseSerialReturn;
  deviceId: string;
  backendMqttConnected?: boolean;
  expectedPublicId?: string | null;
}

interface EventEntry {
  timestamp: number;
  type: string;
  payload: Record<string, unknown>;
}

export function UsbControlPanel({
  serial,
  deviceId,
  backendMqttConnected,
  expectedPublicId,
}: UsbControlPanelProps) {
  const tCommon = useTranslations("common");
  const tUsb = useTranslations("devices.usb");

  const {
    portState,
    deviceState,
    events,
    disconnect,
    refreshStatus,
    sendCommand,
  } = serial;
  const isConnected = portState === "open";
  const hasExpectedPublicId = !!expectedPublicId;
  const serialPublicId = deviceState?.public_id?.trim();
  const isMismatched =
    hasExpectedPublicId && serialPublicId !== expectedPublicId;

  const [eventLog, setEventLog] = useState<EventEntry[]>([]);
  const [confirmAction, setConfirmAction] = useState<
    "suspend" | "resume" | "decommission" | "factory_reset" | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [mqttUri, setMqttUri] = useState("");
  const [mqttUser, setMqttUser] = useState("");
  const [mqttPwd, setMqttPwd] = useState("");
  const [mqttError, setMqttError] = useState("");

  useEffect(() => {
    if (!isConnected || !deviceState || isMismatched || !expectedPublicId)
      return;
    if (deviceState.public_id !== expectedPublicId) return;
    if (!deviceState.total_heap || deviceState.total_heap <= 0) return;

    const freeHeapPct = Math.max(
      0,
      Math.min(
        100,
        Math.round((deviceState.free_heap / deviceState.total_heap) * 100),
      ),
    );

    relayDiagnostics(deviceId, {
      publicId: deviceState.public_id,
      freeHeapPct,
      rssi: deviceState.wifi_rssi ?? null,
      uptimeMs: deviceState.uptime_ms,
      dispatchDaily: deviceState.dispatch_daily ?? 0,
      dispatchTotal: deviceState.dispatch_total ?? 0,
      wifiConnected: deviceState.wifi_connected,
      ip: deviceState.ip ?? null,
      firmwareVersion: deviceState.firmware_version ?? null,
    }).catch(() => {});
  }, [deviceId, deviceState, expectedPublicId, isConnected, isMismatched]);

  const addEvent = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      setEventLog((prev) => {
        const next = [...prev, { timestamp: Date.now(), type, payload }];
        return next.length > 200 ? next.slice(-200) : next;
      });
    },
    [],
  );

  useEffect(() => {
    const eventTypes = [
      "event.wifi_connected",
      "event.wifi_disconnected",
      "event.mqtt_connected",
      "event.mqtt_disconnected",
      "event.activated",
      "event.lifecycle_changed",
      "event.dispatch_ok",
      "event.dispatch_rejected",
    ];

    const handler = (e: Event) => {
      addEvent(e.type, (e as CustomEvent).detail ?? {});
    };

    for (const type of eventTypes) {
      events.addEventListener(type, handler);
    }
    return () => {
      for (const type of eventTypes) {
        events.removeEventListener(type, handler);
      }
    };
  }, [events, addEvent]);

  function eventColorClass(type: string): string {
    if (type.includes("rejected")) return "text-destructive";
    if (type.includes("dispatch")) return "text-action";
    if (type.includes("wifi") || type.includes("mqtt")) return "text-primary";
    return "";
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === "factory_reset") {
        await sendCommand("factory_reset");
      } else {
        await sendCommand("lifecycle", { action: confirmAction });
        await refreshStatus();
      }
      toast.success(tUsb("command_sent"));
      setConfirmAction(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tUsb("command_failed"),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateMqtt() {
    if (!mqttUri.trim() || !mqttUri.startsWith("mqtts://")) {
      setMqttError(tUsb("mqtt_uri_invalid"));
      return;
    }
    if (!mqttUser.trim() || !mqttPwd.trim()) {
      setMqttError(tUsb("mqtt_credentials_required"));
      return;
    }

    setMqttError("");
    setActionLoading(true);
    try {
      await sendCommand("update_mqtt", {
        mqtt_uri: mqttUri.trim(),
        mqtt_user: mqttUser.trim(),
        mqtt_pwd: mqttPwd,
      });
      toast.success(tUsb("command_sent"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tUsb("command_failed"),
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Collapsible defaultOpen>
      <Card className="glass-card rounded-xl p-6">
        <CollapsibleTrigger className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Usb aria-hidden="true" className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">{tUsb("control_panel")}</h2>
            <Badge
              variant="outline"
              className={
                isConnected
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border text-muted-foreground"
              }
            >
              {isConnected ? tUsb("connected") : tUsb("disconnected")}
            </Badge>
          </div>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform [[data-panel-open]_&]:rotate-180"
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 space-y-4">
            {isMismatched && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {tUsb("device_mismatch")}
              </div>
            )}

            {backendMqttConnected && (
              <div className="rounded-xl border border-warning/40 bg-warning/15 p-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/20">
                {tUsb("local_warning")}
              </div>
            )}

            {isConnected && deviceState && (
              <div className="grid grid-cols-2 gap-3 s:grid-cols-3">
                <Card className="rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {tUsb("rssi")}
                  </p>
                  <p className="text-sm font-medium">
                    {deviceState.wifi_rssi ?? "—"} dBm
                  </p>
                </Card>
                <Card className="rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {tUsb("free_heap")}
                  </p>
                  <p className="text-sm font-medium">
                    {deviceState.free_heap
                      ? `${Math.round(deviceState.free_heap / 1024)} KB`
                      : "—"}
                  </p>
                </Card>
                <Card className="rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {tUsb("uptime")}
                  </p>
                  <p className="text-sm font-medium">
                    {deviceState.uptime_ms
                      ? `${Math.round(deviceState.uptime_ms / 60000)}m`
                      : "—"}
                  </p>
                </Card>
                <Card className="rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {tUsb("op_state")}
                  </p>
                  <p className="text-sm font-medium">{deviceState.op_state}</p>
                </Card>
                <Card className="rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {tUsb("wifi")}
                  </p>
                  <p className="text-sm font-medium">
                    {deviceState.wifi_connected
                      ? (deviceState.wifi_ssid ?? tUsb("connected"))
                      : tUsb("disconnected")}
                  </p>
                </Card>
                <Card className="rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {tUsb("mqtt")}
                  </p>
                  <p className="text-sm font-medium">
                    {deviceState.mqtt_connected
                      ? tUsb("connected")
                      : tUsb("disconnected")}
                  </p>
                </Card>
              </div>
            )}

            {isConnected && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading || isMismatched}
                  onClick={() => setConfirmAction("suspend")}
                >
                  {tUsb("suspend")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading || isMismatched}
                  onClick={() => setConfirmAction("resume")}
                >
                  {tUsb("resume")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading || isMismatched}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmAction("decommission")}
                >
                  {tUsb("decommission")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading || isMismatched}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmAction("factory_reset")}
                >
                  {tUsb("factory_reset")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void disconnect()}
                >
                  {tUsb("disconnect")}
                </Button>
              </div>
            )}

            {isConnected && !isMismatched && (
              <Card className="rounded-lg p-3">
                <div className="grid gap-3 s:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="usb-mqtt-uri">{tUsb("mqtt_uri")}</Label>
                    <Input
                      id="usb-mqtt-uri"
                      value={mqttUri}
                      onChange={(e) => setMqttUri(e.target.value)}
                      maxLength={191}
                      placeholder="mqtts://"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="usb-mqtt-user">
                      {tUsb("mqtt_username")}
                    </Label>
                    <Input
                      id="usb-mqtt-user"
                      value={mqttUser}
                      onChange={(e) => setMqttUser(e.target.value)}
                      maxLength={95}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="usb-mqtt-pwd">
                      {tUsb("mqtt_password")}
                    </Label>
                    <Input
                      id="usb-mqtt-pwd"
                      type="password"
                      value={mqttPwd}
                      onChange={(e) => setMqttPwd(e.target.value)}
                      maxLength={127}
                    />
                  </div>
                </div>
                {mqttError && (
                  <p className="mt-2 text-xs text-destructive">{mqttError}</p>
                )}
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => void handleUpdateMqtt()}
                  >
                    {actionLoading && (
                      <Loader2
                        aria-hidden="true"
                        className="mr-2 size-4 animate-spin"
                      />
                    )}
                    {tUsb("update_mqtt")}
                  </Button>
                </div>
              </Card>
            )}

            {eventLog.length > 0 && (
              <Card className="rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                  <span className="text-sm font-medium">{tUsb("events")}</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {eventLog.map((entry) => (
                    <div
                      key={`${entry.timestamp}-${entry.type}`}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={eventColorClass(entry.type)}>
                        {entry.type.replace("event.", "")}
                      </span>
                      {Object.keys(entry.payload).length > 0 && (
                        <span className="text-muted-foreground">
                          {JSON.stringify(entry.payload)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <SerialConsole events={events} />
          </div>
        </CollapsibleContent>
      </Card>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tUsb("confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "factory_reset"
                ? tUsb("factory_reset_confirm")
                : tUsb("lifecycle_confirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={() => void runConfirmedAction()}
            >
              {actionLoading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tCommon("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
}
