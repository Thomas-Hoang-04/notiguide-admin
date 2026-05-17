"use client";

import { Activity, Cpu, Radio, Timer, Wifi, Zap } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeviceDetailDto, HubDiagnosticsDto } from "@/types/device";
import { getDevice } from "./api";

interface HubDiagnosticsPanelProps {
  device: DeviceDetailDto;
  onUpdate: (device: DeviceDetailDto) => void;
}

const HEARTBEAT_POLL_INTERVAL = 15_000;
const STALE_THRESHOLD_MS = 30_000;

function deriveLiveness(
  lastSeenAt: string | null | undefined,
): "alive" | "stale" {
  if (!lastSeenAt) return "stale";
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  return elapsed < STALE_THRESHOLD_MS ? "alive" : "stale";
}

function heapSeverityClass(pct: number): string {
  if (pct > 50) return "text-success";
  if (pct > 35) return "text-warning";
  if (pct > 20) return "text-warning";
  return "text-destructive";
}

function rssiSeverityClass(rssi: number): string {
  if (rssi > -50) return "text-success";
  if (rssi >= -65) return "text-success";
  if (rssi >= -75) return "text-warning";
  return "text-destructive";
}

function uptimeSeverityClass(ms: number): string {
  const days = ms / (24 * 3600 * 1000);
  if (days < 3) return "text-success";
  if (days < 7) return "text-warning";
  if (days < 14) return "text-warning";
  return "text-destructive";
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function HubDiagnosticsPanel({
  device,
  onUpdate,
}: HubDiagnosticsPanelProps) {
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const t = useTranslations("devices.hub.diagnostics");
  const tHub = useTranslations("devices.hub");

  const [liveness, setLiveness] = useState<"alive" | "stale">(() =>
    deriveLiveness(device.lastSeenAt),
  );
  const deviceRef = useRef(device);
  deviceRef.current = device;

  const poll = useCallback(async () => {
    try {
      const updated = await getDevice(deviceRef.current.id);
      onUpdate(updated);
      setLiveness(deriveLiveness(updated.lastSeenAt));
    } catch {
      // Silent — next poll will retry
    }
  }, [onUpdate]);

  useEffect(() => {
    setLiveness(deriveLiveness(device.lastSeenAt));
  }, [device.lastSeenAt]);

  useEffect(() => {
    const id = setInterval(() => void poll(), HEARTBEAT_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  const isAlive = liveness === "alive";
  const isElected = device.isElected;
  const diag = device.diagnostics;

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge label={t("lastHeartbeat")}>
          {device.lastSeenAt ? (
            <span className="text-sm font-medium">
              {format.dateTime(new Date(device.lastSeenAt), {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
              })}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </StatusBadge>

        <Badge
          variant="outline"
          className={
            isAlive
              ? "border-success/40 bg-success/10 text-success"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }
        >
          {isAlive ? tHub("liveness.alive") : tHub("liveness.stale")}
        </Badge>

        {isElected === undefined || isElected === null ? (
          <Skeleton className="h-5 w-20 rounded-full" />
        ) : (
          <Badge
            variant="outline"
            className={
              isElected
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border"
            }
          >
            {isElected ? tHub("election.elected") : tHub("election.standby")}
          </Badge>
        )}

        {diag && (
          <Badge variant="outline" className="border-border">
            {diag.source === "MQTT" ? t("sourceMqtt") : t("sourceUsb")}
          </Badge>
        )}
      </div>

      {diag ? (
        <DiagnosticsGrid
          diag={diag}
          t={t}
          updatedAtLabel={format.relativeTime(new Date(diag.updatedAt), now)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("noData")}
          <span className="ml-1 text-xs">{t("noDataHint")}</span>
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}:</span>
      {children}
    </div>
  );
}

function DiagnosticsGrid({
  diag,
  t,
  updatedAtLabel,
}: {
  diag: HubDiagnosticsDto;
  t: ReturnType<typeof useTranslations>;
  updatedAtLabel: string;
}) {
  const signalLabel = (() => {
    if (diag.rssi == null) return "—";
    if (diag.rssi > -50) return t("signalExcellent");
    if (diag.rssi >= -65) return t("signalGood");
    if (diag.rssi >= -75) return t("signalFair");
    return t("signalWeak");
  })();

  return (
    <div className="grid gap-3 s:grid-cols-2 l:grid-cols-3">
      <MetricCard
        icon={<Cpu className="size-4" />}
        label={t("freeHeap")}
        value={`${diag.freeHeapPct}%`}
        valueClass={heapSeverityClass(diag.freeHeapPct)}
      />
      <MetricCard
        icon={<Wifi className="size-4" />}
        label={t("signal")}
        value={diag.rssi != null ? `${diag.rssi} dBm` : "—"}
        subtitle={signalLabel}
        valueClass={
          diag.rssi != null
            ? rssiSeverityClass(diag.rssi)
            : "text-muted-foreground"
        }
      />
      <MetricCard
        icon={<Timer className="size-4" />}
        label={t("uptime")}
        value={formatUptime(diag.uptimeMs)}
        valueClass={uptimeSeverityClass(diag.uptimeMs)}
      />
      <MetricCard
        icon={<Zap className="size-4" />}
        label={t("dispatches")}
        value={`${diag.dispatchDaily} ${t("dispatchToday")}`}
        subtitle={`${diag.dispatchTotal} ${t("dispatchTotal")}`}
      />
      <MetricCard
        icon={<Radio className="size-4" />}
        label={t("network")}
        value={diag.ip ?? "—"}
        valueClass={diag.ip ? "text-success" : "text-muted-foreground"}
      />
      <MetricCard
        icon={<Activity className="size-4" />}
        label={t("lastUpdated")}
        value={updatedAtLabel}
        valueClass="text-muted-foreground"
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${valueClass ?? ""}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
