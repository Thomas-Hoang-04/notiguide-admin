export type TicketStatus =
  | "WAITING"
  | "CALLED"
  | "SERVED"
  | "CANCELLED"
  | "SKIPPED"
  | "REQUEUED"
  | "UNKNOWN";

export interface TicketDto {
  id: string;
  number: string;
  status: TicketStatus;
  issuedAt: string | null;
  calledAt: string | null;
  position: number | null;
}

export interface NextTicketResponse {
  ticket: TicketDto | null;
}

export interface QueueSizeResponse {
  queueSize: number;
}

export interface TicketStatusResponse {
  status: TicketStatus;
  positionInQueue: number | null;
  estimatedWaitTime: number | null;
}

export interface CleanupResponse {
  cleanedEntries: number;
}

export type QueueEventType =
  | "TICKET_ISSUED"
  | "TICKET_CALLED"
  | "TICKET_SERVED"
  | "TICKET_CANCELLED"
  | "TICKET_SKIPPED"
  | "TICKET_REQUEUED"
  | "TICKET_TRANSFERRED";

export interface QueueSseEvent {
  type: QueueEventType;
  storeId: string;
  ticketId: string;
  ticketNumber: string | null;
  counterId: string | null;
  timestamp: number;
}
