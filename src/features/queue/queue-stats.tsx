"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { getQueueSize } from "@/features/queue/api";
import { POLLING_INTERVAL } from "@/lib/constants";

interface QueueStatsProps {
  storeId: string;
  refreshSignal?: number;
}

export function QueueStats({ storeId, refreshSignal }: QueueStatsProps) {
  const tQueue = useTranslations("queue");
  const [queueSize, setQueueSize] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchSize = useCallback(async () => {
    try {
      const res = await getQueueSize(storeId);
      setQueueSize(res.queueSize);
    } catch {
      // Silently fail on polling errors
    }
  }, [storeId]);

  // Re-fetch when SSE signals a queue change
  useEffect(() => {
    if (refreshSignal) void fetchSize();
  }, [refreshSignal, fetchSize]);

  useEffect(() => {
    void fetchSize();
    intervalRef.current = setInterval(fetchSize, POLLING_INTERVAL);

    function handleVisibility() {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        void fetchSize();
        intervalRef.current = setInterval(fetchSize, POLLING_INTERVAL);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchSize]);

  return (
    <div className="queue-stat-card rounded-xl border border-white/20 bg-primary/8 dark:border-white/8 dark:bg-primary/10">
      <span className="queue-stat-value text-foreground">
        {queueSize ?? tQueue("statFallback")}
      </span>
      <span className="queue-stat-label">{tQueue("inQueue")}</span>
    </div>
  );
}
