import { afterEach, describe, expect, it } from "vitest";
import { useQueueStore } from "@/store/queue";
import type { TicketDto } from "@/types/queue";

const initial = useQueueStore.getState();
afterEach(() => useQueueStore.setState(initial, true));

const ticket = (id: string) =>
  ({ id, number: "A1", status: "CALLED" }) as unknown as TicketDto;

describe("useQueueStore", () => {
  it("adds and removes serving tickets", () => {
    useQueueStore.getState().addServingTicket(ticket("t1"));
    expect(useQueueStore.getState().servingTickets).toHaveLength(1);
    useQueueStore.getState().removeServingTicket("t1");
    expect(useQueueStore.getState().servingTickets).toHaveLength(0);
  });

  it("clearServing empties the list", () => {
    useQueueStore.getState().addServingTicket(ticket("t1"));
    useQueueStore.getState().clearServing();
    expect(useQueueStore.getState().servingTickets).toHaveLength(0);
  });
});
