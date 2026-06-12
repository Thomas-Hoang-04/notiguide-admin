export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    ABORT: "/api/auth/abort",
    REGISTER: "/api/auth/register",
    INVITE: (token: string) => `/api/auth/invite/${encodeURIComponent(token)}`,
  },
  ADMINS: {
    BASE: "/api/admins",
    ME: "/api/admins/me",
    BY_ID: (id: string) => `/api/admins/${id}`,
    VERIFY: (id: string) => `/api/admins/${id}/verify`,
    STORE: (id: string) => `/api/admins/${id}/store`,
    USERNAME: (id: string) => `/api/admins/${id}/username`,
    PASSWORD: (id: string) => `/api/admins/${id}/password`,
    LOGIN_HISTORY: (id: string, limit = 20) =>
      `/api/admins/${id}/login-history?limit=${limit}`,
    SESSIONS: (id: string) => `/api/admins/${id}/sessions`,
    SESSIONS_ALL: (id: string) => `/api/admins/${id}/sessions/all`,
    SESSION: (id: string, sessionId: string) =>
      `/api/admins/${id}/sessions/${sessionId}`,
    REQUESTS: "/api/admins/requests",
    APPROVE_REQUEST: (id: string) => `/api/admins/requests/${id}/approve`,
    REJECT_REQUEST: (id: string) => `/api/admins/requests/${id}/reject`,
  },
  STORES: {
    BASE: "/api/stores",
    BY_ID: (id: string) => `/api/stores/${id}`,
    SETTINGS: (id: string) => `/api/stores/${id}/settings`,
    SERVICE_TYPES: (id: string) => `/api/stores/${id}/service-types`,
    SERVICE_TYPE: (storeId: string, id: string) =>
      `/api/stores/${storeId}/service-types/${id}`,
    SLUGS: (id: string) => `/api/stores/${id}/slugs`,
    SLUG_RETIRE: (storeId: string, slug: string) =>
      `/api/stores/${storeId}/slugs/${encodeURIComponent(slug)}/retire`,
    SLUG: (storeId: string, slug: string) =>
      `/api/stores/${storeId}/slugs/${encodeURIComponent(slug)}`,
    INVITE_LINK: (id: string) => `/api/stores/${id}/invite-link`,
    INVITE_LINK_ROTATE: (id: string) => `/api/stores/${id}/invite-link/rotate`,
  },
  QUEUE: {
    PUBLIC_INFO: (storeId: string) => `/api/queue/public/${storeId}/info`,
    SIZE: (storeId: string) => `/api/queue/admin/${storeId}/size`,
    NEXT: (storeId: string) => `/api/queue/admin/${storeId}/next`,
    TICKETS: (storeId: string) => `/api/queue/admin/${storeId}/tickets`,
    TICKET: (storeId: string, ticketId: string) =>
      `/api/queue/admin/${storeId}/tickets/${ticketId}`,
    CALL_TICKET: (storeId: string, ticketId: string) =>
      `/api/queue/admin/${storeId}/tickets/${ticketId}/call`,
    SERVE: (storeId: string, ticketId: string) =>
      `/api/queue/admin/${storeId}/tickets/${ticketId}/serve`,
    CANCEL: (storeId: string, ticketId: string) =>
      `/api/queue/admin/${storeId}/tickets/${ticketId}/cancel`,
    CLEANUP: (storeId: string) => `/api/queue/admin/${storeId}/cleanup`,
    EVENTS: (storeId: string) => `/api/queue/admin/${storeId}/events`,
    PAUSE: (storeId: string) => `/api/queue/admin/${storeId}/pause`,
    RESUME: (storeId: string) => `/api/queue/admin/${storeId}/resume`,
    NO_SHOW: (storeId: string, ticketId: string) =>
      `/api/queue/admin/${storeId}/tickets/${ticketId}/no-show`,
    DEVICE_TICKETS: (storeId: string) =>
      `/api/queue/admin/${storeId}/device-tickets`,
    AVAILABLE_DEVICES: (storeId: string) =>
      `/api/queue/admin/${storeId}/available-devices`,
  },
  ANALYTICS: {
    REALTIME: (storeId: string) => `/api/analytics/${storeId}/realtime`,
    SUMMARY: (storeId: string, qs: string) =>
      `/api/analytics/${storeId}/summary?${qs}`,
    PEAK_HOURS: (storeId: string, qs: string) =>
      `/api/analytics/${storeId}/peak-hours?${qs}`,
    THROUGHPUT: (storeId: string, qs: string) =>
      `/api/analytics/${storeId}/throughput?${qs}`,
    WAIT_DISTRIBUTION: (storeId: string, qs: string) =>
      `/api/analytics/${storeId}/wait-distribution?${qs}`,
    HEATMAP: (storeId: string, qs: string) =>
      `/api/analytics/${storeId}/heatmap?${qs}`,
    OVERVIEW_REALTIME: "/api/analytics/overview/realtime",
    OVERVIEW: (qs: string) => `/api/analytics/overview?${qs}`,
    OVERVIEW_THROUGHPUT: (qs: string) =>
      `/api/analytics/overview/throughput?${qs}`,
  },
  DEVICES: {
    BASE: "/api/devices",
    BY_ID: (id: string) => `/api/devices/${id}`,
    PASSIVE: "/api/devices/passive",
    APPROVE: (id: string) => `/api/devices/${id}/approve`,
    REJECT: (id: string) => `/api/devices/${id}/reject`,
    RF_CODE: (id: string) => `/api/devices/${id}/rf-code`,
    LIFECYCLE: (id: string) => `/api/devices/${id}/lifecycle`,
    REPROVISION: (id: string) => `/api/devices/${id}/reprovision`,
    TOKENS: "/api/devices/enrollment-tokens",
    TOKEN_BY_HASH: (hash: string) => `/api/devices/enrollment-tokens/${hash}`,
    USB_DISPATCH_PAYLOAD: "/api/devices/usb-dispatch-payload",
    DIAGNOSTICS: (id: string) => `/api/devices/${id}/diagnostics`,
    HUB_HEALTH: "/api/devices/hub-health",
    RENAME: (id: string) => `/api/devices/${id}/name`,
  },
  ORGS: {
    ME: "/api/orgs/me",
    INVITE_LINK: "/api/orgs/me/invite-link",
    INVITE_LINK_ROTATE: "/api/orgs/me/invite-link/rotate",
  },
} as const;

export const ROLES = {
  SUPER_ADMIN: "ROLE_SUPER_ADMIN",
  ADMIN: "ROLE_ADMIN",
} as const;

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).+$/,
} as const;

export const USERNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 100,
  PATTERN: /^[a-zA-Z0-9_]+$/,
} as const;

export const STORE_RULES = {
  NAME_MAX: 255,
  ADDRESS_MAX: 1000,
} as const;

export const POLLING_INTERVAL = 10_000; // 10 seconds for queue/analytics stats
