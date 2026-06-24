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
