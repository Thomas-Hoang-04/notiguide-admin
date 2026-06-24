"use client";

import { create } from "zustand";
import type { OfflineAction } from "@/types/queue";

export interface OutboxEntry {
  ticketId: string;
  action: OfflineAction;
  at: string;
}

export interface SnapshotTicket {
  ticketId: string;
  number: string;
  deviceId: string;
  hubSlot: number | null;
}

interface PersistShape {
  slotByDevice: Record<string, number>;
  waitingDeviceTickets: SnapshotTicket[];
  outbox: OutboxEntry[];
}

interface OfflineDispatchState extends PersistShape {
  setSlot: (deviceId: string, hubSlot: number) => void;
  slotFor: (deviceId: string) => number | null;
  setWaitingSnapshot: (tickets: SnapshotTicket[]) => void;
  shiftWaitingDeviceTicket: () => SnapshotTicket | null;
  appendOutbox: (entry: OutboxEntry) => void;
  clearOutbox: (ticketIds: string[]) => void;
  hydrate: () => void;
}

const STORAGE_KEY = "offlineDispatch";

export const useOfflineDispatchStore = create<OfflineDispatchState>()(
  (set, get) => {
    const persist = () => {
      const { slotByDevice, waitingDeviceTickets, outbox } = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ slotByDevice, waitingDeviceTickets, outbox }),
      );
    };
    return {
      slotByDevice: {},
      waitingDeviceTickets: [],
      outbox: [],

      setSlot: (deviceId, hubSlot) => {
        set({ slotByDevice: { ...get().slotByDevice, [deviceId]: hubSlot } });
        persist();
      },

      slotFor: (deviceId) => get().slotByDevice[deviceId] ?? null,

      setWaitingSnapshot: (tickets) => {
        set({ waitingDeviceTickets: tickets });
        persist();
      },

      shiftWaitingDeviceTicket: () => {
        const [head, ...rest] = get().waitingDeviceTickets;
        if (!head) return null;
        set({ waitingDeviceTickets: rest });
        persist();
        return head;
      },

      appendOutbox: (entry) => {
        set({ outbox: [...get().outbox, entry] });
        persist();
      },

      clearOutbox: (ticketIds) => {
        const remove = new Set(ticketIds);
        set({ outbox: get().outbox.filter((e) => !remove.has(e.ticketId)) });
        persist();
      },

      hydrate: () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as Partial<PersistShape>;
          set({
            slotByDevice: parsed.slotByDevice ?? {},
            waitingDeviceTickets: parsed.waitingDeviceTickets ?? [],
            outbox: parsed.outbox ?? [],
          });
        } catch {
          // ignore corrupt data
        }
      },
    };
  },
);
