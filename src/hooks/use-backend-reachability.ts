"use client";

import { useCallback, useReducer } from "react";
import {
  INITIAL_REACHABILITY,
  isReachable,
  reachabilityReducer,
} from "@/lib/dispatch/reachability";

export function useBackendReachability() {
  const [state, dispatch] = useReducer(
    reachabilityReducer,
    INITIAL_REACHABILITY,
  );
  const onConnectionChange = useCallback((s: "open" | "closed") => {
    dispatch({ type: s === "open" ? "sse_open" : "sse_error" });
  }, []);
  const onApiError = useCallback(() => dispatch({ type: "api_error" }), []);
  return { reachable: isReachable(state), onConnectionChange, onApiError };
}
