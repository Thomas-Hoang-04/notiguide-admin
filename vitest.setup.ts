import { beforeEach } from "vitest";

// The store modules touch Web Storage directly (auth.login → localStorage, queue → sessionStorage).
// The "node" test environment has no DOM, so provide a minimal in-memory Storage implementation.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) =>
      store.has(key) ? (store.get(key) as string) : null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } as Storage;
}

globalThis.localStorage = createMemoryStorage();
globalThis.sessionStorage = createMemoryStorage();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
