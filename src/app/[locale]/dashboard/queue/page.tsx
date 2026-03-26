"use client";

import { Loader2, PauseCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { callNext, getPublicStoreInfo } from "@/features/queue/api";
import { CleanupButton } from "@/features/queue/cleanup-button";
import { QueueStats } from "@/features/queue/queue-stats";
import { QueueStateToggle } from "@/features/queue/queue-state-toggle";
import { ServingDisplay } from "@/features/queue/serving-display";
import { useStoreName } from "@/features/queue/store-selector";
import { TicketLookup } from "@/features/queue/ticket-lookup";
import { WaitingList } from "@/features/queue/waiting-list";
import { getStore } from "@/features/store/api";
import { useQueueEvents } from "@/hooks/use-queue-events";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { useLayoutStore } from "@/store/layout";
import { useQueueStore } from "@/store/queue";
import { ApiError } from "@/types/api";
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

  const [counterId, setCounterId] = useState(() => {
    if (typeof window === "undefined" || !storeId) return "";
    return localStorage.getItem(`store:${storeId}:defaultCounterId`) ?? "";
  });
  const [callLoading, setCallLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState(false);
  const [statsRefreshSignal, setStatsRefreshSignal] = useState(0);
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [allowJumpCall, setAllowJumpCall] = useState(false);
  const [queueState, setQueueState] = useState("ACTIVE");

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

  // Fetch store settings for allowJumpCall and queue state
  useEffect(() => {
    if (!storeId) return;
    void (async () => {
      try {
        const [store, publicInfo] = await Promise.all([
          getStore(storeId),
          getPublicStoreInfo(storeId),
        ]);
        setAllowJumpCall(store.allowJumpCall);
        setQueueState(publicInfo.queueState);
      } catch {
        // Default to false / ACTIVE if fetch fails
      }
    })();
  }, [storeId]);

  const storeName = useStoreName(storeId);

  // SSE: real-time queue events
  useQueueEvents(storeId, (event) => {
    setStatsRefreshSignal((s) => s + 1);

    if (
      (event.type === "TICKET_SERVED" ||
        event.type === "TICKET_CANCELLED" ||
        event.type === "TICKET_SKIPPED" ||
        event.type === "TICKET_REQUEUED") &&
      servingTicketsRef.current.some((t) => t.id === event.ticketId)
    ) {
      removeServingTicket(event.ticketId);
    }
  });

  const handleCallNext = useCallback(async () => {
    if (!storeId || callLoadingRef.current) return;
    setCallLoading(true);
    setEmptyMessage(false);

    try {
      const result = await callNext(storeId, counterId.trim() || undefined);
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
  }, [storeId, counterId, addServingTicket, tErrors]);

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
      <div className="space-y-4 l:space-y-6">
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
          <div className="flex items-center gap-2.5 rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-3 text-sm text-warning-foreground dark:border-warning/15 dark:bg-warning/5">
            <PauseCircle aria-hidden="true" className="size-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium">{tQueue("queuePaused")}</p>
              <p className="text-xs text-muted-foreground">
                {tQueue("queuePausedDescription")}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 l:gap-6 2xl:grid-cols-3">
          {/* Left column — main controls */}
          <div className="space-y-4 l:space-y-6 2xl:col-span-2">
            {/* Stats + Call Next */}
            <div className="glass-card glass-context-action flex flex-wrap items-center gap-4 rounded-xl p-3 l:gap-6 l:p-4">
              <QueueStats
                storeId={storeId}
                refreshSignal={statsRefreshSignal}
              />

              <div className="queue-divider max-xs:hidden" />

              <div className="flex flex-1 items-center gap-3">
                <div className="w-36 shrink-0 l:w-40">
                  <Label
                    htmlFor="counterId"
                    className="text-xs text-muted-foreground"
                  >
                    {tQueue("counterIdLabel")}
                  </Label>
                  <Input
                    id="counterId"
                    value={counterId}
                    onChange={(e) => setCounterId(e.target.value)}
                    placeholder={tQueue("counterIdPlaceholder")}
                    maxLength={100}
                    className="mt-1"
                  />
                </div>
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
            <ServingDisplay storeId={storeId} />
          </div>

          {/* Right column — ticket lookup + waiting list */}
          <div className="space-y-4 l:space-y-6">
            <TicketLookup
              searchQuery={ticketSearchQuery}
              onSearchQueryChange={setTicketSearchQuery}
            />
            <WaitingList
              storeId={storeId}
              refreshSignal={statsRefreshSignal}
              searchQuery={ticketSearchQuery}
              allowJumpCall={allowJumpCall}
              counterId={counterId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
