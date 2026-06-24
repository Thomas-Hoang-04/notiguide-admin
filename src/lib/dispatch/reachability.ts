export const FAILURE_THRESHOLD = 2;

export interface ReachabilityState {
  consecutiveFailures: number;
  reachable: boolean;
}

export const INITIAL_REACHABILITY: ReachabilityState = {
  consecutiveFailures: 0,
  reachable: true,
};

export type ReachabilityEvent =
  | { type: "sse_open" }
  | { type: "sse_error" }
  | { type: "api_error" };

export function reachabilityReducer(
  state: ReachabilityState,
  event: ReachabilityEvent,
): ReachabilityState {
  if (event.type === "sse_open") {
    return { consecutiveFailures: 0, reachable: true };
  }
  const consecutiveFailures = state.consecutiveFailures + 1;
  return {
    consecutiveFailures,
    reachable: consecutiveFailures < FAILURE_THRESHOLD,
  };
}

export function isReachable(state: ReachabilityState): boolean {
  return state.reachable;
}
