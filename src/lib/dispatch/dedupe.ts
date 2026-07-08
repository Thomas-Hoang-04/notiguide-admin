export function createDispatchDedupe(ttlMs = 5000) {
  const seenAt = new Map<string, number>();
  return {
    seen(key: string, now: number = Date.now()): boolean {
      const last = seenAt.get(key);
      if (last !== undefined && now - last < ttlMs) return false;
      seenAt.set(key, now);
      return true;
    },
  };
}

export function createAppliedRegistry(ttlMs = 60_000) {
  const appliedAt = new Map<string, number>();
  return {
    mark(key: string, now: number = Date.now()): void {
      appliedAt.set(key, now);
    },
    has(key: string, now: number = Date.now()): boolean {
      const at = appliedAt.get(key);
      return at !== undefined && now - at < ttlMs;
    },
  };
}
