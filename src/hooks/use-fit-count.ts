"use client";

import { type RefObject, useEffect, useState } from "react";

interface UseFitCountOptions {
  /** When false, measurement is skipped and `fallback` is returned. */
  enabled?: boolean;
  /** Value used when disabled or before the first measurement. */
  fallback?: number;
}

/**
 * Returns how many fixed-height items (`slotPx` tall, including inter-item gap)
 * fit the referenced container's measured height. ResizeObserver-driven.
 *
 * The container's height must be layout-determined (flex-fill), NOT content-driven,
 * so changing the rendered item count cannot feed back into the measurement.
 */
export function useFitCount(
  containerRef: RefObject<HTMLElement | null>,
  slotPx: number,
  { enabled = true, fallback = 5 }: UseFitCountOptions = {},
): number {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    const element = containerRef.current;
    if (!enabled || !element) {
      setCount(fallback);
      return;
    }
    const compute = () => {
      const usable = element.clientHeight;
      setCount(Math.max(1, Math.floor(usable / slotPx)));
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, slotPx, enabled, fallback]);

  return count;
}
