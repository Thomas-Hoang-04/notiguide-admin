import { get, post, put } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
  AvailableDevicesResponse,
  CleanupResponse,
  IssueDeviceTicketRequest,
  NextTicketResponse,
  QueueSizeResponse,
  TicketDto,
  TicketStatusResponse,
} from "@/types/queue";
import type {
  StoreSettingsDto,
  UpdateStoreSettingsRequest,
} from "@/types/store";

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

export function callNext(
  storeId: string,
  serviceTypeId?: string,
  counterId?: string,
) {
  const query = new URLSearchParams();
  if (serviceTypeId) query.set("serviceTypeId", serviceTypeId);
  if (counterId) query.set("counterId", counterId);
  const qs = query.toString();
  return post<NextTicketResponse>(
    `${API_ROUTES.QUEUE.NEXT(storeId)}${qs ? `?${qs}` : ""}`,
  );
}

export function listWaitingTickets(storeId: string) {
  return get<TicketDto[]>(API_ROUTES.QUEUE.TICKETS(storeId));
}

export function getTicketStatus(storeId: string, ticketId: string) {
  return get<TicketStatusResponse>(API_ROUTES.QUEUE.TICKET(storeId, ticketId));
}

export function callSpecificTicket(storeId: string, ticketId: string) {
  return post<NextTicketResponse>(
    API_ROUTES.QUEUE.CALL_TICKET(storeId, ticketId),
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

export function getStoreSettings(storeId: string) {
  return get<StoreSettingsDto>(API_ROUTES.STORES.SETTINGS(storeId));
}

export function updateStoreSettings(
  storeId: string,
  request: UpdateStoreSettingsRequest,
) {
  return put<StoreSettingsDto>(API_ROUTES.STORES.SETTINGS(storeId), request);
}

export function getAvailableDevices(storeId: string) {
  return get<AvailableDevicesResponse>(
    API_ROUTES.QUEUE.AVAILABLE_DEVICES(storeId),
  );
}

export function issueDeviceTicket(
  storeId: string,
  request: IssueDeviceTicketRequest,
) {
  return post<TicketDto>(API_ROUTES.QUEUE.DEVICE_TICKETS(storeId), request);
}
