"use client";

import { useEffect, useRef } from "react";
import { API_BASE_URL, API_ROUTES } from "@/lib/constants";
import type { QueueSseEvent } from "@/types/queue";

type QueueEventHandler = (event: QueueSseEvent) => void;

/**
 * Subscribes to real-time queue events via SSE.
 * Falls back gracefully — if the connection fails, the caller
 * still has polling as the primary data source.
 */
export function useQueueEvents(
  storeId: string | null,
  onEvent: QueueEventHandler,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!storeId) return;

    const url = `${API_BASE_URL}${API_ROUTES.QUEUE.EVENTS(storeId)}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    const eventTypes = [
      "TICKET_ISSUED",
      "TICKET_CALLED",
      "TICKET_SERVED",
      "TICKET_CANCELLED",
      "TICKET_SKIPPED",
      "TICKET_REQUEUED",
      "TICKET_TRANSFERRED",
      "DEVICE_DISPATCH_FAILED",
    ];

    function handleEvent(e: MessageEvent) {
      try {
        const data: QueueSseEvent = JSON.parse(e.data);
        onEventRef.current(data);
      } catch {
        // Ignore malformed events
      }
    }

    for (const type of eventTypes) {
      eventSource.addEventListener(type, handleEvent);
    }

    return () => {
      eventSource.close();
    };
  }, [storeId]);
}
