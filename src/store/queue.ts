"use client";

import { create } from "zustand";
import { getTicketStatus } from "@/features/queue/api";
import type { TicketDto } from "@/types/queue";

interface QueueState {
  servingTickets: TicketDto[];

  addServingTicket: (ticket: TicketDto) => void;
  removeServingTicket: (ticketId: string) => void;
  clearServing: () => void;
  hydrateQueue: (storeId: string | null) => Promise<void>;
}

function persistTickets(tickets: TicketDto[]) {
  if (tickets.length > 0) {
    sessionStorage.setItem("servingTickets", JSON.stringify(tickets));
  } else {
    sessionStorage.removeItem("servingTickets");
  }
}

export const useQueueStore = create<QueueState>()((set, get) => ({
  servingTickets: [],

  addServingTicket: (ticket: TicketDto) => {
    const current = get().servingTickets;
    if (current.some((t) => t.id === ticket.id)) return;
    const updated = [...current, ticket];
    persistTickets(updated);
    set({ servingTickets: updated });
  },

  removeServingTicket: (ticketId: string) => {
    const updated = get().servingTickets.filter((t) => t.id !== ticketId);
    persistTickets(updated);
    set({ servingTickets: updated });
  },

  clearServing: () => {
    persistTickets([]);
    set({ servingTickets: [] });
  },

  hydrateQueue: async (storeId: string | null) => {
    let tickets: TicketDto[] = [];

    const ticketsJson = sessionStorage.getItem("servingTickets");
    if (ticketsJson) {
      try {
        tickets = JSON.parse(ticketsJson);
      } catch {
        // ignore corrupt data
      }
    }

    set({ servingTickets: tickets });

    if (tickets.length === 0 || !storeId) return;

    // Re-validate each serving ticket against backend
    const valid: TicketDto[] = [];
    for (const ticket of tickets) {
      try {
        const res = await getTicketStatus(storeId, ticket.id);
        if (res.status === "CALLED") {
          valid.push(ticket);
        }
      } catch {
        // Ticket no longer exists — skip
      }
    }

    persistTickets(valid);
    set({ servingTickets: valid });
  },
}));
