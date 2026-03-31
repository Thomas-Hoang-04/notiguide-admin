"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Kbd } from "@/components/ui/kbd";
import {
  cancelTicket,
  getStoreSettings,
  serveTicket,
  triggerNoShow,
} from "@/features/queue/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { getTicketStatusTranslationKey } from "@/lib/i18n-keys";
import { useQueueStore } from "@/store/queue";
import { ApiError } from "@/types/api";
import type { TicketDto } from "@/types/queue";
import type { StoreSettingsDto } from "@/types/store";
import "@/styles/queue.css";

interface ServingDisplayProps {
  storeId: string;
  allowNoShow: boolean;
}

const ticketTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function ServingDisplay({ storeId, allowNoShow }: ServingDisplayProps) {
  const { servingTickets } = useQueueStore();
  const tQueue = useTranslations("queue");
  const [settings, setSettings] = useState<StoreSettingsDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoreSettings(storeId)
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (servingTickets.length === 0) {
    return (
      <div className="glass-card glass-context-action ticket-display rounded-xl text-center text-muted-foreground">
        <p className="text-lg">{tQueue("noTicketServing")}</p>
        <p className="text-sm">{tQueue("noTicketSubtext")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {servingTickets.map((ticket, index) => (
        <ServingTicketCard
          key={ticket.id}
          storeId={storeId}
          ticket={ticket}
          isPrimary={index === 0}
          settings={settings}
          allowNoShow={allowNoShow}
        />
      ))}
    </div>
  );
}

interface ServingTicketCardProps {
  storeId: string;
  ticket: TicketDto;
  isPrimary: boolean;
  settings: StoreSettingsDto | null;
  allowNoShow: boolean;
}

function useGraceCountdown(
  calledAt: string | null,
  gracePeriodSec: number,
): number {
  const [remaining, setRemaining] = useState(() => {
    if (!calledAt || gracePeriodSec <= 0) return 0;
    const elapsed = (Date.now() - new Date(calledAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(gracePeriodSec - elapsed));
  });

  useEffect(() => {
    if (!calledAt || gracePeriodSec <= 0) {
      setRemaining(0);
      return;
    }

    const calledAtTime = new Date(calledAt).getTime();

    function tick() {
      const elapsed = (Date.now() - calledAtTime) / 1000;
      const left = Math.max(0, Math.ceil(gracePeriodSec - elapsed));
      setRemaining(left);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [calledAt, gracePeriodSec]);

  return remaining;
}

function ServingTicketCard({
  storeId,
  ticket,
  isPrimary,
  settings,
  allowNoShow,
}: ServingTicketCardProps) {
  const { removeServingTicket } = useQueueStore();
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");
  const [serveLoading, setServeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const gracePeriodSec = settings?.gracePeriodSec ?? 0;
  const graceRemaining = useGraceCountdown(ticket.calledAt, gracePeriodSec);
  const hasGracePeriod = allowNoShow && gracePeriodSec > 0;

  const serveLoadingRef = useRef(false);
  const cancelLoadingRef = useRef(false);
  const noShowLoadingRef = useRef(false);
  serveLoadingRef.current = serveLoading;
  cancelLoadingRef.current = cancelLoading;
  noShowLoadingRef.current = noShowLoading;

  const anyLoading = serveLoading || cancelLoading || noShowLoading;

  const handleServe = useCallback(async () => {
    if (
      serveLoadingRef.current ||
      cancelLoadingRef.current ||
      noShowLoadingRef.current
    )
      return;
    setServeLoading(true);
    try {
      await serveTicket(storeId, ticket.id);
      toast.success(tQueue("servedToast", { number: ticket.number }));
      removeServingTicket(ticket.id);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setServeLoading(false);
    }
  }, [removeServingTicket, ticket, storeId, tErrors, tQueue]);

  const handleNoShow = useCallback(async () => {
    if (
      serveLoadingRef.current ||
      cancelLoadingRef.current ||
      noShowLoadingRef.current
    )
      return;
    setNoShowLoading(true);
    try {
      await triggerNoShow(storeId, ticket.id);
      toast.warning(tQueue("noShowSuccess", { number: ticket.number }));
      removeServingTicket(ticket.id);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setNoShowLoading(false);
    }
  }, [removeServingTicket, ticket, storeId, tErrors, tQueue]);

  const openCancelDialog = useCallback(() => {
    if (
      serveLoadingRef.current ||
      cancelLoadingRef.current ||
      noShowLoadingRef.current
    )
      return;
    setCancelDialogOpen(true);
  }, []);

  // Keyboard shortcuts: S to serve, C to cancel, X for no-show — only for primary ticket
  useEffect(() => {
    if (!isPrimary) return;

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        void handleServe();
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        openCancelDialog();
      }
      if ((e.key === "x" || e.key === "X") && hasGracePeriod) {
        e.preventDefault();
        void handleNoShow();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPrimary, handleServe, openCancelDialog, handleNoShow, hasGracePeriod]);

  async function handleCancel() {
    setCancelLoading(true);
    try {
      await cancelTicket(storeId, ticket.id);
      toast.warning(tQueue("cancelledToast", { number: ticket.number }));
      removeServingTicket(ticket.id);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setCancelLoading(false);
      setCancelDialogOpen(false);
    }
  }

  return (
    <div className="glass-card glass-context-action ticket-display rounded-xl">
      <Badge
        variant="outline"
        className="h-auto border-action/30 bg-action/10 px-3 py-1 text-sm text-action"
      >
        {tQueue(getTicketStatusTranslationKey(ticket.status))}
      </Badge>
      <span className="ticket-number text-foreground">#{ticket.number}</span>

      <div className="flex flex-wrap items-center gap-10">
        {ticket.issuedAt && (
          <div className="ticket-time-block">
            <span className="ticket-time-label">{tQueue("issuedLabel")}</span>
            <span className="ticket-time-value">
              {ticketTimeFormatter.format(new Date(ticket.issuedAt))}
            </span>
          </div>
        )}
        {ticket.calledAt && (
          <div className="ticket-time-block">
            <span className="ticket-time-label">{tQueue("calledLabel")}</span>
            <span className="ticket-time-value">
              {ticketTimeFormatter.format(new Date(ticket.calledAt))}
            </span>
          </div>
        )}
      </div>

      {hasGracePeriod && graceRemaining > 0 && (
        <div className="ticket-time-block">
          <span className="ticket-time-label text-warning">
            {tQueue("graceTimerLabel")}
          </span>
          <span className="tabular-nums text-lg font-semibold text-warning">
            {tQueue("graceTimer", { seconds: graceRemaining })}
          </span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-3">
        <Button
          onClick={handleServe}
          disabled={anyLoading}
          className="queue-action-btn bg-success text-success-foreground hover:bg-success/90"
        >
          {serveLoading && (
            <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
          )}
          {tQueue("serveButton")}
          {isPrimary && (
            <Kbd aria-hidden="true" className="ml-2">
              S
            </Kbd>
          )}
        </Button>

        {hasGracePeriod && (
          <Button
            variant="outline"
            onClick={() => void handleNoShow()}
            disabled={anyLoading}
            className="queue-action-btn border-warning text-warning hover:bg-warning/10"
          >
            {noShowLoading && (
              <Loader2
                aria-hidden="true"
                className="mr-2 size-4 animate-spin"
              />
            )}
            {tQueue("noShowButton")}
            {isPrimary && (
              <Kbd aria-hidden="true" className="ml-2">
                X
              </Kbd>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={openCancelDialog}
          disabled={anyLoading}
          className="queue-action-btn border-destructive text-destructive hover:bg-destructive/10"
        >
          {tQueue("cancelButton")}
          {isPrimary && (
            <Kbd aria-hidden="true" className="ml-2">
              C
            </Kbd>
          )}
        </Button>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tQueue("cancelDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tQueue("cancelDialogDescription", {
                number: ticket.number,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>
              {tQueue("keepButton")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tQueue("cancelDialogTitle")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
