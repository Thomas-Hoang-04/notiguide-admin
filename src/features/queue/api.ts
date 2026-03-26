import { get, post, put } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
  CleanupResponse,
  NextTicketResponse,
  QueueSizeResponse,
  TicketDto,
  TicketStatusResponse,
} from "@/types/queue";
import type { StoreSettingsDto, UpdateStoreSettingsRequest } from "@/types/store";

export function getQueueSize(storeId: string) {
  return get<QueueSizeResponse>(API_ROUTES.QUEUE.SIZE(storeId));
}

export function getPublicStoreInfo(storeId: string) {
  return get<{
    id: string;
    name: string;
    queueState: string;
    maxQueueSize: number;
  }>(API_ROUTES.QUEUE.PUBLIC_INFO(storeId));
}

export function callNext(storeId: string, counterId?: string) {
  const params = counterId ? `?counterId=${encodeURIComponent(counterId)}` : "";
  return post<NextTicketResponse>(`${API_ROUTES.QUEUE.NEXT(storeId)}${params}`);
}

export function listWaitingTickets(storeId: string) {
  return get<TicketDto[]>(API_ROUTES.QUEUE.TICKETS(storeId));
}

export function getTicketStatus(storeId: string, ticketId: string) {
  return get<TicketStatusResponse>(API_ROUTES.QUEUE.TICKET(storeId, ticketId));
}

export function callSpecificTicket(
  storeId: string,
  ticketId: string,
  counterId?: string,
) {
  const params = counterId ? `?counterId=${encodeURIComponent(counterId)}` : "";
  return post<NextTicketResponse>(
    `${API_ROUTES.QUEUE.CALL_TICKET(storeId, ticketId)}${params}`,
  );
}

export function serveTicket(storeId: string, ticketId: string) {
  return post<void>(API_ROUTES.QUEUE.SERVE(storeId, ticketId));
}

export function cancelTicket(storeId: string, ticketId: string) {
  return post<void>(API_ROUTES.QUEUE.CANCEL(storeId, ticketId));
}

export function cleanupServing(storeId: string) {
  return post<CleanupResponse>(API_ROUTES.QUEUE.CLEANUP(storeId));
}

export function pauseQueue(storeId: string) {
  return post<void>(API_ROUTES.QUEUE.PAUSE(storeId));
}

export function resumeQueue(storeId: string) {
  return post<void>(API_ROUTES.QUEUE.RESUME(storeId));
}

export function triggerNoShow(storeId: string, ticketId: string) {
  return post<void>(API_ROUTES.QUEUE.NO_SHOW(storeId, ticketId));
}

export function transferTicket(
  storeId: string,
  ticketId: string,
  targetServiceTypeId: string,
) {
  return post<void>(
    `${API_ROUTES.QUEUE.TRANSFER(storeId, ticketId)}?targetServiceTypeId=${targetServiceTypeId}`,
  );
}

export function getStoreSettings(storeId: string) {
  return get<StoreSettingsDto>(API_ROUTES.STORES.SETTINGS(storeId));
}

export function updateStoreSettings(
  storeId: string,
  request: UpdateStoreSettingsRequest,
) {
  return put<StoreSettingsDto>(API_ROUTES.STORES.SETTINGS(storeId), request);
}
