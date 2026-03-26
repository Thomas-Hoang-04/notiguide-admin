"use client";

import { Loader2, PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { callSpecificTicket, listWaitingTickets } from "@/features/queue/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useQueueStore } from "@/store/queue";
import { ApiError } from "@/types/api";
import type { TicketDto } from "@/types/queue";

interface WaitingListProps {
  storeId: string;
  refreshSignal: number;
  searchQuery: string;
  allowJumpCall: boolean;
  counterId: string;
}

const ticketTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function WaitingList({
  storeId,
  refreshSignal,
  searchQuery,
  allowJumpCall,
  counterId,
}: WaitingListProps) {
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");
  const { addServingTicket } = useQueueStore();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const result = await listWaitingTickets(storeId);
      setTickets(result);
    } catch {
      // Silent fail — list will be empty
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Initial load + refresh on SSE events
  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (refreshSignal) void fetchTickets();
  }, [refreshSignal, fetchTickets]);

  async function handleCall(ticket: TicketDto) {
    setCallingId(ticket.id);
    try {
      const result = await callSpecificTicket(
        storeId,
        ticket.id,
        counterId.trim() || undefined,
      );
      if (result.ticket) {
        addServingTicket(result.ticket);
        toast.success(
          tQueue("waitingListCalledToast", { number: ticket.number }),
        );
        setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      } else {
        toast.error(tQueue("waitingListCallFailed"));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setCallingId(null);
    }
  }

  const normalizedQuery = searchQuery.replace(/^#/, "").trim();
  const filtered = normalizedQuery
    ? tickets.filter((t) => t.number.includes(normalizedQuery))
    : tickets;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{tQueue("waitingListTitle")}</h3>

      <div className="space-y-2">
        {loading &&
          tickets.length === 0 &&
          ["a", "b", "c"].map((id) => (
            <div
              key={id}
              className="glass-panel glass-panel-primary rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {tQueue("waitingListEmpty")}
          </p>
        )}

        {filtered.map((ticket) => (
          <div
            key={ticket.id}
            className="glass-panel glass-panel-primary flex items-center justify-between rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold tabular-nums">
                #{ticket.number}
              </span>
              {ticket.issuedAt && (
                <span className="text-xs text-muted-foreground">
                  {tQueue("waitingListIssuedAt", {
                    time: ticketTimeFormatter.format(new Date(ticket.issuedAt)),
                  })}
                </span>
              )}
            </div>
            {allowJumpCall && (
              <Button
                size="sm"
                onClick={() => void handleCall(ticket)}
                disabled={callingId !== null}
                className="gap-1.5 bg-action text-action-foreground hover:bg-action-hover"
              >
                {callingId === ticket.id ? (
                  <Loader2
                    aria-hidden="true"
                    className="size-3.5 animate-spin"
                  />
                ) : (
                  <PhoneCall aria-hidden="true" className="size-3.5" />
                )}
                {tQueue("waitingListCallButton")}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
