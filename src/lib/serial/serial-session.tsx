"use client";

import { createContext, type ReactNode, useContext } from "react";
import { type UseSerialReturn, useSerial } from "./use-serial";

const SerialSessionContext = createContext<UseSerialReturn | null>(null);

/**
 * Owns the single Web Serial session for the dashboard. Mounted once in the
 * dashboard layout so the port survives route changes; page-level consumers
 * must use useSerialSession() instead of instantiating useSerial() directly,
 * which would create a competing connection that closes the port on unmount.
 */
export function SerialSessionProvider({ children }: { children: ReactNode }) {
  const serial = useSerial();
  return (
    <SerialSessionContext.Provider value={serial}>
      {children}
    </SerialSessionContext.Provider>
  );
}

export function useSerialSession(): UseSerialReturn {
  const session = useContext(SerialSessionContext);
  if (!session) {
    throw new Error(
      "useSerialSession must be used within a SerialSessionProvider",
    );
  }
  return session;
}
