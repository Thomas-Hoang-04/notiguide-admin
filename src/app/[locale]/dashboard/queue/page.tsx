"use client";

import { Loader2, PauseCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callNext, getPublicStoreInfo } from "@/features/queue/api";
import { CleanupButton } from "@/features/queue/cleanup-button";
import { DeviceDispatchPanel } from "@/features/queue/device-dispatch-panel";
import { QueueStateToggle } from "@/features/queue/queue-state-toggle";
import { QueueStats } from "@/features/queue/queue-stats";
import { ServingDisplay } from "@/features/queue/serving-display";
import { useStoreName } from "@/features/queue/store-selector";
import { TicketLookup } from "@/features/queue/ticket-lookup";
import { WaitingList } from "@/features/queue/waiting-list";
import { getStore, listServiceTypes } from "@/features/store/api";
import { useQueueEvents } from "@/hooks/use-queue-events";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { useLayoutStore } from "@/store/layout";
import { useQueueStore } from "@/store/queue";
import { ApiError } from "@/types/api";
import type { ServiceTypeDto } from "@/types/store";
import "@/styles/queue.css";

export default function QueuePage() {
  const { storeId } = useAuthStore();
  const { setPageGradientClass, clearPageGradientClass } = useLayoutStore();
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");
  const {
    addServingTicket,
    servingTickets,
    removeServingTicket,
    hydrateQueue,
  } = useQueueStore();

  const [serviceTypes, setServiceTypes] = useState<ServiceTypeDto[]>([]);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(() => {
    if (typeof window === "undefined" || !storeId) return "";
    return localStorage.getItem(`store:${storeId}:defaultServiceTypeId`) ?? "";
  });
  const [callLoading, setCallLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState(false);
  const [statsRefreshSignal, setStatsRefreshSignal] = useState(0);
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [allowJumpCall, setAllowJumpCall] = useState(false);
  const [allowNoShow, setAllowNoShow] = useState(false);
  const [queueState, setQueueState] = useState("ACTIVE");

  const [deviceRefreshSignal, setDeviceRefreshSignal] = useState(0);
  const [ticketReloading, setTicketReloading] = useState(false);

  // Refs for keyboard shortcut checks
  const callLoadingRef = useRef(false);
  const servingTicketsRef = useRef(servingTickets);
  callLoadingRef.current = callLoading;
  servingTicketsRef.current = servingTickets;

  // Set warm gradient on layout wrapper so topbar shares same background
  useEffect(() => {
    setPageGradientClass("bg-gradient-page-warm");
    return () => clearPageGradientClass();
  }, [setPageGradientClass, clearPageGradientClass]);

  // Hydrate from sessionStorage
  useEffect(() => {
    void hydrateQueue(storeId);
  }, [hydrateQueue, storeId]);

  // Fetch store settings, service types, and queue state
  useEffect(() => {
    if (!storeId) return;
    void (async () => {
      try {
        const [store, publicInfo, types] = await Promise.all([
          getStore(storeId),
          getPublicStoreInfo(storeId),
          listServiceTypes(storeId),
        ]);
        setAllowJumpCall(store.allowJumpCall ?? false);
        setAllowNoShow(store.allowNoShow ?? false);
        setQueueState(publicInfo.queueState);
        const activeTypes = types.filter((t) => t.isActive);
        setServiceTypes(activeTypes);
        // Auto-select first active type if no stored default or stored default is no longer active
        setSelectedServiceTypeId((prev) => {
          if (prev && activeTypes.some((t) => t.id === prev)) return prev;
          return activeTypes[0]?.id ?? "";
        });
      } catch {
        // Default to false / ACTIVE if fetch fails
      }
    })();
  }, [storeId]);

  const storeName = useStoreName(storeId);

  const handleDeviceDispatched = useCallback(() => {
    setStatsRefreshSignal((s) => s + 1);
    setDeviceRefreshSignal((s) => s + 1);
  }, []);

  const handleTicketReload = useCallback(() => {
    setTicketReloading(true);
    setStatsRefreshSignal((s) => s + 1);
    window.setTimeout(() => setTicketReloading(false), 500);
  }, []);

  // SSE: real-time queue events
  useQueueEvents(storeId, (event) => {
    setStatsRefreshSignal((s) => s + 1);

    if (event.type === "DEVICE_DISPATCH_FAILED") {
      const reason = event.reason;
      if (reason === "no_active_transmitter") {
        toast.error(tQueue("dispatch.errorNoActiveTransmitter"));
      } else if (reason === "device_not_found") {
        toast.error(tQueue("dispatch.errorDeviceNotFound"));
      } else {
        toast.error(tQueue("dispatch.errorInfrastructure"));
      }
      setDeviceRefreshSignal((s) => s + 1);
      return;
    }

    if (
      event.type === "TICKET_SERVED" ||
      event.type === "TICKET_CANCELLED" ||
      event.type === "TICKET_SKIPPED" ||
      event.type === "TICKET_REQUEUED"
    ) {
      if (servingTicketsRef.current.some((t) => t.id === event.ticketId)) {
        removeServingTicket(event.ticketId);
      }
      setDeviceRefreshSignal((s) => s + 1);
    }
  });

  const handleCallNext = useCallback(async () => {
    if (!storeId || callLoadingRef.current) return;
    setCallLoading(true);
    setEmptyMessage(false);

    try {
      const result = await callNext(
        storeId,
        selectedServiceTypeId || undefined,
      );
      if (result.ticket) {
        addServingTicket(result.ticket);
        setStatsRefreshSignal((s) => s + 1);
      } else {
        setEmptyMessage(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setCallLoading(false);
    }
  }, [storeId, selectedServiceTypeId, addServingTicket, tErrors]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when focused on input elements
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Escape") return; // let dialogs handle Escape

      if ((e.key === "n" || e.key === "N") && storeId) {
        e.preventDefault();
        void handleCallNext();
      }

      // S for serve and C for cancel are handled within ServingDisplay
      // via its own keyboard event listener
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [storeId, handleCallNext]);

  if (!storeId) {
    return (
      <div className="queue-page-shell -m-3 p-3 s:-m-4 s:p-4 xl:-m-5 xl:p-5 3xl:-m-6 3xl:p-6 4xl:-m-8 4xl:p-8">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          {tQueue("noStoreAssigned")}
        </div>
      </div>
    );
  }

  return (
    <div className="queue-page-shell -m-3 p-3 s:-m-4 s:p-4 xl:-m-5 xl:p-5 3xl:-m-6 3xl:p-6 4xl:-m-8 4xl:p-8">
      <div className="space-y-4 l:space-y-6 2xl:flex 2xl:h-full 2xl:min-h-0 2xl:flex-col 2xl:space-y-0 2xl:gap-6 2xl:overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 l:gap-4">
          <h1 className="text-xl font-bold l:text-2xl">
            {storeName
              ? tQueue("titleWithStore", { storeName })
              : tQueue("title")}
          </h1>
          <p className="sr-only">{tQueue("keyboardShortcutsDescription")}</p>
          <div className="flex items-center gap-2">
            <QueueStateToggle
              storeId={storeId}
              currentState={queueState}
              onStateChange={setQueueState}
            />
            <CleanupButton storeId={storeId} />
          </div>
        </div>

        {/* Paused Banner */}
        {queueState === "PAUSED" && (
          <div className="flex items-center gap-2.5 rounded-xl border border-warning/40 bg-warning/15 px-3.5 py-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/20">
            <PauseCircle
              aria-hidden="true"
              className="size-4 shrink-0 text-warning"
            />
            <div>
              <p className="font-medium">{tQueue("queuePaused")}</p>
              <p className="text-xs text-warning/80">
                {tQueue("queuePausedDescription")}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 l:gap-6 2xl:min-h-0 2xl:flex-1 2xl:grid-cols-3">
          {/* Left column — main controls */}
          <div className="space-y-4 l:space-y-6 2xl:col-span-2 2xl:flex 2xl:min-h-0 2xl:flex-col 2xl:space-y-0 2xl:gap-6">
            {/* Stats + Call Next */}
            <div className="glass-card glass-context-action flex flex-wrap items-center gap-4 rounded-xl p-3 l:gap-6 l:p-4">
              <QueueStats
                storeId={storeId}
                refreshSignal={statsRefreshSignal}
              />

              <div className="queue-divider max-xs:hidden" />

              <div className="flex flex-1 items-center gap-3">
                {serviceTypes.length > 0 && (
                  <div className="w-44 shrink-0 l:w-52">
                    <Label className="text-xs text-muted-foreground">
                      {tQueue("serviceQueueLabel")}
                    </Label>
                    <Select
                      value={selectedServiceTypeId}
                      onValueChange={(v) => {
                        const nextServiceTypeId = v ?? "";
                        setSelectedServiceTypeId(nextServiceTypeId);
                        if (storeId) {
                          if (nextServiceTypeId) {
                            localStorage.setItem(
                              `store:${storeId}:defaultServiceTypeId`,
                              nextServiceTypeId,
                            );
                          } else {
                            localStorage.removeItem(
                              `store:${storeId}:defaultServiceTypeId`,
                            );
                          }
                        }
                        setStatsRefreshSignal((s) => s + 1);
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9 gap-2 px-3">
                        <SelectValue
                          placeholder={tQueue("serviceQueuePlaceholder")}
                        >
                          {(value: string | null) => {
                            const match = serviceTypes.find(
                              (st) => st.id === value,
                            );
                            return match ? match.name : null;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="p-1.5">
                        {serviceTypes.map((st) => (
                          <SelectItem
                            key={st.id}
                            value={st.id}
                            className="py-2"
                          >
                            {st.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  onClick={handleCallNext}
                  disabled={callLoading}
                  className="queue-action-btn queue-call-next-button ml-auto"
                >
                  {callLoading && (
                    <Loader2
                      aria-hidden="true"
                      className="mr-2 size-4 animate-spin"
                    />
                  )}
                  {tQueue("callNextButton")}
                  <Kbd aria-hidden="true" className="ml-2">
                    N
                  </Kbd>
                </Button>
              </div>
            </div>

            {emptyMessage && (
              <p className="text-sm text-muted-foreground">
                {tQueue("queueEmpty")}
              </p>
            )}

            {/* Currently Serving */}
            <ServingDisplay storeId={storeId} allowNoShow={allowNoShow} />

            {/* Receivers — inline device dispatch */}
            <DeviceDispatchPanel
              storeId={storeId}
              refreshSignal={deviceRefreshSignal}
              onDispatched={handleDeviceDispatched}
            />
          </div>

          {/* Right column — ticket lookup + waiting list */}
          <div className="space-y-4 l:space-y-6 2xl:min-h-0 2xl:overflow-y-auto">
            <TicketLookup
              searchQuery={ticketSearchQuery}
              onSearchQueryChange={setTicketSearchQuery}
              onReload={handleTicketReload}
              reloading={ticketReloading}
            />
            <WaitingList
              storeId={storeId}
              refreshSignal={statsRefreshSignal}
              searchQuery={ticketSearchQuery}
              allowJumpCall={allowJumpCall}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
