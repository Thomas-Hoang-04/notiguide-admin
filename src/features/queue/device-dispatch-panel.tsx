"use client";

import { ChevronLeft, ChevronRight, RefreshCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvailableDevices, issueDeviceTicket } from "@/features/queue/api";
import { useFitCount } from "@/hooks/use-fit-count";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { DispatchMode } from "@/lib/dispatch/mode";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";
import { DeviceDispatchCard } from "./device-dispatch-card";

// .queue-device-card height (56px) + list gap (8px)
const DEVICE_CARD_SLOT_PX = 64;
const DEFAULT_PAGE_SIZE = 5;

interface DeviceDispatchPanelProps {
  storeId: string;
  mode: DispatchMode;
  refreshSignal: number;
  onDispatched: () => void;
}

export function DeviceDispatchPanel({
  storeId,
  mode,
  refreshSignal,
  onDispatched,
}: DeviceDispatchPanelProps) {
  const tQueue = useTranslations("queue");
  const tErrors = useTranslations("errors");

  const canDispatch = mode !== "DISABLED" && mode !== "OFFLINE_SERIAL";

  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [dispatchingIds, setDispatchingIds] = useState<Set<string>>(new Set());

  const listRef = useRef<HTMLDivElement>(null);
  const is2xlUp = useMediaQuery("(min-width: 64rem)");
  const pageSize = useFitCount(listRef, DEVICE_CARD_SLOT_PX, {
    enabled: is2xlUp,
    fallback: DEFAULT_PAGE_SIZE,
  });

  const fetchDevices = useCallback(async () => {
    try {
      const res = await getAvailableDevices(storeId);
      setDevices(res.devices);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (refreshSignal) void fetchDevices();
  }, [refreshSignal, fetchDevices]);

  const handleReload = useCallback(() => {
    setReloading(true);
    void fetchDevices().finally(() => setReloading(false));
  }, [fetchDevices]);

  const handleDispatch = useCallback(
    async (deviceId: string) => {
      setDispatchingIds((prev) => new Set(prev).add(deviceId));
      try {
        const ticket = await issueDeviceTicket(storeId, {
          deviceId,
          allowSerialFallback: mode === "ONLINE_SERIAL_FALLBACK",
        });
        toast.success(
          tQueue("dispatch.successToast", { number: ticket.number }),
        );
        onDispatched();
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.error === "no_active_transmitter") {
            toast.error(tQueue("dispatch.errorNoActiveTransmitter"));
          } else if (err.error === "device_busy") {
            toast.error(tQueue("dispatch.errorDeviceBusy"));
          } else {
            toast.error(translateCommonApiError(err, tErrors));
          }
        } else {
          toast.error(translateNetworkError(tErrors));
        }
      } finally {
        setDispatchingIds((prev) => {
          const next = new Set(prev);
          next.delete(deviceId);
          return next;
        });
      }
    },
    [storeId, mode, onDispatched, tQueue, tErrors],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return devices;
    return devices.filter((d) =>
      (d.assignedName || d.publicId || "").toLowerCase().includes(normalized),
    );
  }, [devices, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Derive the in-range page during render — no setState-in-effect. When the list
  // shrinks or pageSize changes, `safePage` clamps automatically without an extra render.
  const safePage = Math.min(Math.max(0, page), totalPages - 1);

  const visible = filtered.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize,
  );

  return (
    <div className="flex flex-col gap-3 2xl:min-h-0 2xl:flex-1">
      {/* Header: title + reload (left of search) + search */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">
          {tQueue("dispatch.panelTitle")}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={reloading}
            onClick={handleReload}
            aria-label={tQueue("dispatch.refresh")}
          >
            <RefreshCcw
              aria-hidden="true"
              className={`size-4 ${reloading ? "animate-spin" : ""}`}
            />
          </Button>
          <div className="relative w-40 l:w-48">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={tQueue("dispatch.searchPlaceholder")}
              className="h-9 pl-9"
            />
          </div>
        </div>
      </div>

      {/* Card list — flex-filled; height is layout-determined, not content-driven */}
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      >
        {mode === "OFFLINE_SERIAL" ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {tQueue("dispatch.offlineIssueDisabled")}
          </p>
        ) : (
          <>
            {loading &&
              ["a", "b", "c"].map((id) => (
                <Skeleton key={id} className="queue-device-card rounded-lg" />
              ))}

            {!loading && filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {tQueue("dispatch.disabledNoDevice")}
              </p>
            )}

            {!loading &&
              visible.map((device) => (
                <DeviceDispatchCard
                  key={device.id}
                  device={device}
                  dispatchReady={canDispatch}
                  dispatching={dispatchingIds.has(device.id)}
                  onDispatch={handleDispatch}
                />
              ))}
          </>
        )}
      </div>

      {/* Pagination footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            disabled={safePage === 0}
            onClick={() => setPage(Math.max(0, safePage - 1))}
            aria-label={tQueue("dispatch.prevPage")}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {tQueue("dispatch.pageIndicator", {
              current: safePage + 1,
              total: totalPages,
            })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            aria-label={tQueue("dispatch.nextPage")}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
