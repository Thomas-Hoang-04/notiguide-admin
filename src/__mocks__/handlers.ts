import {
  ADMINS,
  EXISTING_TICKETS,
  LOGIN_HISTORY,
  QUEUE_SIZES,
  QUEUE_STATES,
  SESSIONS,
  SERVICE_TYPES,
  STORE_SETTINGS,
  STORES,
  WAITING_TICKETS,
  getDailyThroughput,
  getHourlyHeatmap,
  getOverview,
  getOverviewRealtime,
  getOverviewThroughput,
  getPeakHours,
  getRealtimeStats,
  getStoreSummary,
  getWaitDistribution,
} from "./data";

type MockResponse = { status: number; body?: unknown; headers?: Record<string, string> };
const MOCK_AUTH_ADMIN_ID_KEY = "mock_auth_admin_id";

// Simulate network delay (ms)
const DELAY = 200;

function json(body: unknown, status = 200): MockResponse {
  return { status, body };
}

function noContent(): MockResponse {
  return { status: 204 };
}

function notFound(entity: string): MockResponse {
  return {
    status: 404,
    body: {
      timestamp: new Date().toISOString(),
      code: 404,
      error: "Not Found",
      message: `${entity} not found`,
      path: "",
      method: "GET",
    },
  };
}

function badRequest(message: string, path: string, method: string): MockResponse {
  return {
    status: 400,
    body: {
      timestamp: new Date().toISOString(),
      code: 400,
      error: "Bad Request",
      message,
      path,
      method,
    },
  };
}

function unauthorized(path: string, method: string): MockResponse {
  return {
    status: 401,
    body: {
      timestamp: new Date().toISOString(),
      code: 401,
      error: "Unauthorized",
      message: "Unauthorized",
      path,
      method,
    },
  };
}

function paginate<T>(items: T[], page: number, size: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  const start = page * size;
  return {
    items: items.slice(start, start + size),
    page,
    size,
    totalItems,
    totalPages,
  };
}

function readMockAuthAdminId() {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem(MOCK_AUTH_ADMIN_ID_KEY);
}

function writeMockAuthAdminId(adminId: string | null) {
  if (typeof window === "undefined") return;

  if (adminId) {
    sessionStorage.setItem(MOCK_AUTH_ADMIN_ID_KEY, adminId);
  } else {
    sessionStorage.removeItem(MOCK_AUTH_ADMIN_ID_KEY);
  }
}

let currentUserId: string | null = readMockAuthAdminId();
let isAuthenticated = currentUserId !== null;

// SSE connection tracker
let sseInterval: ReturnType<typeof setInterval> | null = null;

export function handleRequest(
  method: string,
  path: string,
  body: unknown,
): MockResponse | null {
  const params = new URL(path, "http://localhost").searchParams;
  const pathname = new URL(path, "http://localhost").pathname;

  // ── Auth ─────────────────────────────────────────────
  if (method === "POST" && pathname === "/api/auth/login") {
    const { username } = body as { username: string; password: string };
    const admin = ADMINS.find((a) => a.username === username.toLowerCase());
    if (!admin) {
      return {
        status: 401,
        body: {
          timestamp: new Date().toISOString(),
          code: 401,
          error: "Unauthorized",
          message: "Invalid username or password",
          path: pathname,
          method: "POST",
        },
      };
    }
    if (!admin.isVerified) {
      return {
        status: 403,
        body: {
          timestamp: new Date().toISOString(),
          code: 403,
          error: "Forbidden",
          message: "Your account has not been verified yet",
          path: pathname,
          method: "POST",
        },
      };
    }
    currentUserId = admin.id;
    isAuthenticated = true;
    writeMockAuthAdminId(admin.id);

    // Record login history
    const history = LOGIN_HISTORY[admin.id] ?? [];
    history.unshift({
      id: `lh-${Date.now()}`,
      ipAddress: "127.0.0.1",
      success: true,
      createdAt: new Date().toISOString(),
    });
    LOGIN_HISTORY[admin.id] = history;

    return json({ admin, sessionId: `sess-${Date.now()}` });
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    currentUserId = null;
    isAuthenticated = false;
    writeMockAuthAdminId(null);
    return noContent();
  }

  if (method === "POST" && pathname === "/api/auth/refresh") {
    if (!currentUserId) return unauthorized(pathname, method);
    return noContent();
  }

  if (
    !isAuthenticated &&
    (pathname.startsWith("/api/admins") ||
      pathname.startsWith("/api/stores") ||
      pathname.startsWith("/api/queue/admin/") ||
      pathname.startsWith("/api/analytics"))
  ) {
    return unauthorized(pathname, method);
  }

  // ── Admins ───────────────────────────────────────────
  if (method === "GET" && pathname === "/api/admins/me") {
    const me = ADMINS.find((a) => a.id === currentUserId);
    return me ? json(me) : notFound("Admin");
  }

  if (method === "GET" && pathname === "/api/admins") {
    const page = Number(params.get("page") ?? 0);
    const size = Number(params.get("size") ?? 20);
    const storeId = params.get("storeId");
    const role = params.get("role");
    let filtered = storeId
      ? ADMINS.filter((a) => a.storeId === storeId)
      : ADMINS;
    if (role) {
      filtered = filtered.filter((a) => a.role === role);
    }
    return json(paginate(filtered, page, size));
  }

  if (method === "POST" && pathname === "/api/admins") {
    const req = body as {
      username: string;
      role: "ROLE_ADMIN" | "ROLE_SUPER_ADMIN";
      storeId: string | null;
    };
    const store = req.storeId ? STORES.find((s) => s.id === req.storeId) : null;
    const newAdmin = {
      id: `a-${Date.now()}`,
      username: req.username.toLowerCase(),
      role: req.role,
      storeId: req.storeId,
      storeName: store?.name ?? null,
      isVerified: false,
      createdBy: currentUserId,
      verifiedBy: null,
      verifiedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ADMINS.push(newAdmin);
    return json(newAdmin, 201);
  }

  const verifyMatch = pathname.match(/^\/api\/admins\/([^/]+)\/verify$/);
  if (method === "PATCH" && verifyMatch) {
    const admin = ADMINS.find((a) => a.id === verifyMatch[1]);
    if (!admin) return notFound("Admin");
    admin.isVerified = true;
    admin.verifiedBy = currentUserId;
    admin.verifiedAt = new Date().toISOString();
    return json(admin);
  }

  const usernameMatch = pathname.match(/^\/api\/admins\/([^/]+)\/username$/);
  if (method === "PATCH" && usernameMatch) {
    const admin = ADMINS.find((a) => a.id === usernameMatch[1]);
    if (!admin) return notFound("Admin");
    const { username } = body as { username: string };
    const normalized = username.toLowerCase();
    if (ADMINS.some((a) => a.username === normalized && a.id !== admin.id)) {
      return {
        status: 409,
        body: {
          timestamp: new Date().toISOString(),
          code: 409,
          error: "Conflict",
          message: `Username '${normalized}' is already taken`,
          path: pathname,
          method: "PATCH",
        },
      };
    }
    admin.username = normalized;
    admin.updatedAt = new Date().toISOString();
    return json(admin);
  }

  const pwMatch = pathname.match(/^\/api\/admins\/([^/]+)\/password$/);
  if (method === "PATCH" && pwMatch) {
    const admin = ADMINS.find((a) => a.id === pwMatch[1]);
    if (!admin) return notFound("Admin");
    admin.updatedAt = new Date().toISOString();
    return json(admin);
  }

  const storeAssignMatch = pathname.match(/^\/api\/admins\/([^/]+)\/store$/);
  if (method === "PATCH" && storeAssignMatch) {
    const admin = ADMINS.find((a) => a.id === storeAssignMatch[1]);
    if (!admin) return notFound("Admin");
    const { storeId } = body as { storeId: string | null };
    admin.storeId = storeId;
    admin.storeName = storeId ? STORES.find((s) => s.id === storeId)?.name ?? null : null;
    admin.updatedAt = new Date().toISOString();
    return json(admin);
  }

  // Login history
  const loginHistoryMatch = pathname.match(/^\/api\/admins\/([^/]+)\/login-history$/);
  if (method === "GET" && loginHistoryMatch) {
    const adminId = loginHistoryMatch[1];
    const limit = Number(params.get("limit") ?? 20);
    const history = LOGIN_HISTORY[adminId] ?? [];
    const items = history.slice(0, limit);
    return json({ items, hasMore: history.length > limit });
  }

  // Sessions
  const sessionsMatch = pathname.match(/^\/api\/admins\/([^/]+)\/sessions$/);
  if (method === "GET" && sessionsMatch) {
    const adminId = sessionsMatch[1];
    return json(SESSIONS[adminId] ?? []);
  }

  const revokeSessionMatch = pathname.match(/^\/api\/admins\/([^/]+)\/sessions\/([^/]+)$/);
  if (method === "DELETE" && revokeSessionMatch) {
    const adminId = revokeSessionMatch[1];
    const sessionId = revokeSessionMatch[2];
    const sessions = SESSIONS[adminId];
    if (sessions) {
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        sessions.splice(idx, 1);
        return noContent();
      }
    }
    return notFound("Session");
  }

  const deleteAdminMatch = pathname.match(/^\/api\/admins\/([^/]+)$/);
  if (method === "DELETE" && deleteAdminMatch) {
    const idx = ADMINS.findIndex((a) => a.id === deleteAdminMatch[1]);
    if (idx === -1) return notFound("Admin");
    ADMINS.splice(idx, 1);
    return noContent();
  }

  // ── Stores ───────────────────────────────────────────
  if (method === "GET" && pathname === "/api/stores") {
    const page = Number(params.get("page") ?? 0);
    const size = Number(params.get("size") ?? 20);
    return json(paginate(STORES, page, size));
  }

  const storeByIdMatch = pathname.match(/^\/api\/stores\/([^/]+)$/);
  if (method === "GET" && storeByIdMatch) {
    const store = STORES.find((s) => s.id === storeByIdMatch[1]);
    return store ? json(store) : notFound("Store");
  }

  if (method === "POST" && pathname === "/api/stores") {
    const req = body as { name: string; address?: string };
    const newStore = {
      id: `s-${Date.now()}`,
      name: req.name,
      address: req.address ?? null,
      isActive: true,
      allowJumpCall: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    STORES.push(newStore);
    STORE_SETTINGS[newStore.id] = {
      storeId: newStore.id,
      maxQueueSize: 0,
      gracePeriodSec: 120,
      noShowAction: "SKIP",
      maxRequeues: 0,
      requeueOffset: 0,
      alertThreshold: 3,
      updatedAt: new Date().toISOString(),
    };
    QUEUE_STATES[newStore.id] = "ACTIVE";
    QUEUE_SIZES[newStore.id] = 0;
    WAITING_TICKETS[newStore.id] = [];
    SERVICE_TYPES[newStore.id] = [];
    return json(newStore, 201);
  }

  if (method === "PUT" && storeByIdMatch) {
    const store = STORES.find((s) => s.id === storeByIdMatch[1]);
    if (!store) return notFound("Store");
    const req = body as {
      name?: string;
      address?: string | null;
      isActive?: boolean;
      allowJumpCall?: boolean;
    };
    if (req.name !== undefined) store.name = req.name;
    if (req.address !== undefined) store.address = req.address;
    if (req.isActive !== undefined) store.isActive = req.isActive;
    if (req.allowJumpCall !== undefined)
      store.allowJumpCall = req.allowJumpCall;
    store.updatedAt = new Date().toISOString();
    return json(store);
  }

  if (method === "DELETE" && storeByIdMatch) {
    const idx = STORES.findIndex((s) => s.id === storeByIdMatch[1]);
    if (idx === -1) return notFound("Store");
    STORES.splice(idx, 1);
    return noContent();
  }

  // Store settings
  const storeSettingsMatch = pathname.match(/^\/api\/stores\/([^/]+)\/settings$/);
  if (storeSettingsMatch) {
    const storeId = storeSettingsMatch[1];
    if (method === "GET") {
      const settings = STORE_SETTINGS[storeId];
      return settings ? json(settings) : notFound("Store settings");
    }
    if (method === "PUT") {
      const existing = STORE_SETTINGS[storeId];
      if (!existing) return notFound("Store settings");
      const req = body as Record<string, unknown>;
      if (req.maxQueueSize !== undefined) existing.maxQueueSize = req.maxQueueSize as number;
      if (req.gracePeriodSec !== undefined) existing.gracePeriodSec = req.gracePeriodSec as number;
      if (req.noShowAction !== undefined) existing.noShowAction = req.noShowAction as string;
      if (req.maxRequeues !== undefined) existing.maxRequeues = req.maxRequeues as number;
      if (req.requeueOffset !== undefined) existing.requeueOffset = req.requeueOffset as number;
      if (req.alertThreshold !== undefined) existing.alertThreshold = req.alertThreshold as number;
      existing.updatedAt = new Date().toISOString();
      return json(existing);
    }
  }

  // Service types
  const serviceTypesMatch = pathname.match(/^\/api\/stores\/([^/]+)\/service-types$/);
  if (serviceTypesMatch) {
    const storeId = serviceTypesMatch[1];
    if (method === "GET") {
      return json(SERVICE_TYPES[storeId] ?? []);
    }
    if (method === "POST") {
      const req = body as { name: string; prefix: string };
      const storeTypes = SERVICE_TYPES[storeId] ?? [];
      if (storeTypes.some((t) => t.prefix === req.prefix.toUpperCase())) {
        return badRequest(`Prefix '${req.prefix}' already exists`, pathname, method);
      }
      const newType = {
        id: `st-${Date.now()}`,
        storeId,
        name: req.name,
        prefix: req.prefix.toUpperCase(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storeTypes.push(newType);
      SERVICE_TYPES[storeId] = storeTypes;
      return json(newType, 201);
    }
  }

  const serviceTypeByIdMatch = pathname.match(/^\/api\/stores\/([^/]+)\/service-types\/([^/]+)$/);
  if (serviceTypeByIdMatch) {
    const storeId = serviceTypeByIdMatch[1];
    const typeId = serviceTypeByIdMatch[2];
    const storeTypes = SERVICE_TYPES[storeId] ?? [];
    const typeIdx = storeTypes.findIndex((t) => t.id === typeId);

    if (method === "PUT") {
      if (typeIdx === -1) return notFound("Service type");
      const req = body as { name?: string; prefix?: string; isActive?: boolean };
      if (req.name !== undefined) storeTypes[typeIdx].name = req.name;
      if (req.prefix !== undefined) storeTypes[typeIdx].prefix = req.prefix.toUpperCase();
      if (req.isActive !== undefined) storeTypes[typeIdx].isActive = req.isActive;
      storeTypes[typeIdx].updatedAt = new Date().toISOString();
      return json(storeTypes[typeIdx]);
    }
    if (method === "DELETE") {
      if (typeIdx === -1) return notFound("Service type");
      storeTypes.splice(typeIdx, 1);
      return noContent();
    }
  }

  // ── Queue ────────────────────────────────────────────

  // Public store info (used by queue page)
  const publicInfoMatch = pathname.match(/^\/api\/queue\/public\/([^/]+)\/info$/);
  if (method === "GET" && publicInfoMatch) {
    const storeId = publicInfoMatch[1];
    const store = STORES.find((s) => s.id === storeId);
    if (!store) return notFound("Store");
    const settings = STORE_SETTINGS[storeId];
    return json({
      id: store.id,
      name: store.name,
      queueState: QUEUE_STATES[storeId] ?? "ACTIVE",
      maxQueueSize: settings?.maxQueueSize ?? 0,
    });
  }

  const queueSizeMatch = pathname.match(/^\/api\/queue\/admin\/([^/]+)\/size$/);
  if (method === "GET" && queueSizeMatch) {
    const storeId = queueSizeMatch[1];
    return json({ queueSize: QUEUE_SIZES[storeId] ?? 0 });
  }

  const queueNextMatch = pathname.match(/^\/api\/queue\/admin\/([^/]+)\/next$/);
  if (method === "POST" && queueNextMatch) {
    const storeId = queueNextMatch[1];
    if (QUEUE_STATES[storeId] === "PAUSED") {
      return badRequest("Queue is paused", pathname, method);
    }
    const waiting = WAITING_TICKETS[storeId] ?? [];
    if (waiting.length === 0) return json({ ticket: null });
    const next = waiting.shift();
    if (!next) return json({ ticket: null });
    QUEUE_SIZES[storeId] = waiting.length;
    next.status = "CALLED";
    next.calledAt = new Date().toISOString();
    next.position = null;
    return json({ ticket: next });
  }

  const waitingTicketsMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/tickets$/,
  );
  if (method === "GET" && waitingTicketsMatch) {
    const storeId = waitingTicketsMatch[1];
    return json(WAITING_TICKETS[storeId] ?? []);
  }

  // Call specific ticket (jump-call)
  const callTicketMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/tickets\/([^/]+)\/call$/,
  );
  if (method === "POST" && callTicketMatch) {
    const storeId = callTicketMatch[1];
    const ticketId = callTicketMatch[2];
    const waiting = WAITING_TICKETS[storeId] ?? [];
    const idx = waiting.findIndex((t) => t.id === ticketId);
    if (idx === -1) return notFound("Ticket");
    const ticket = waiting.splice(idx, 1)[0];
    QUEUE_SIZES[storeId] = waiting.length;
    // Re-number positions
    waiting.forEach((t, i) => { t.position = i + 1; });
    ticket.status = "CALLED";
    ticket.calledAt = new Date().toISOString();
    ticket.position = null;
    return json({ ticket });
  }

  const ticketStatusMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/tickets\/([^/]+)$/,
  );
  if (method === "GET" && ticketStatusMatch) {
    const ticketId = ticketStatusMatch[2];
    const ticket = EXISTING_TICKETS[ticketId];
    if (!ticket) return notFound("Ticket");
    return json({
      status: ticket.status,
      positionInQueue: ticket.position,
      estimatedWaitTime: ticket.position ? ticket.position * 3 : null,
    });
  }

  const serveMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/tickets\/([^/]+)\/serve$/,
  );
  if (method === "POST" && serveMatch) {
    const storeId = serveMatch[1];
    const ticketId = serveMatch[2];
    const waiting = WAITING_TICKETS[storeId];
    if (waiting) {
      const idx = waiting.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        waiting.splice(idx, 1);
        QUEUE_SIZES[storeId] = waiting.length;
      }
    }
    return noContent();
  }

  const cancelMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/tickets\/([^/]+)\/cancel$/,
  );
  if (method === "POST" && cancelMatch) {
    const storeId = cancelMatch[1];
    const ticketId = cancelMatch[2];
    const waiting = WAITING_TICKETS[storeId];
    if (waiting) {
      const idx = waiting.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        waiting.splice(idx, 1);
        QUEUE_SIZES[storeId] = waiting.length;
        waiting.forEach((t, i) => { t.position = i + 1; });
      }
    }
    return noContent();
  }

  // No-show
  const noShowMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/tickets\/([^/]+)\/no-show$/,
  );
  if (method === "POST" && noShowMatch) {
    return noContent();
  }

  // Transfer
  const transferMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/tickets\/([^/]+)\/transfer$/,
  );
  if (method === "POST" && transferMatch) {
    return noContent();
  }

  const cleanupMatch = pathname.match(
    /^\/api\/queue\/admin\/([^/]+)\/cleanup$/,
  );
  if (method === "POST" && cleanupMatch) {
    return json({ cleanedEntries: Math.floor(Math.random() * 4) });
  }

  // Pause / resume
  const pauseMatch = pathname.match(/^\/api\/queue\/admin\/([^/]+)\/pause$/);
  if (method === "POST" && pauseMatch) {
    QUEUE_STATES[pauseMatch[1]] = "PAUSED";
    return noContent();
  }

  const resumeMatch = pathname.match(/^\/api\/queue\/admin\/([^/]+)\/resume$/);
  if (method === "POST" && resumeMatch) {
    QUEUE_STATES[resumeMatch[1]] = "ACTIVE";
    return noContent();
  }

  // SSE events — return a special marker so mock-init can handle it
  const eventsMatch = pathname.match(/^\/api\/queue\/admin\/([^/]+)\/events$/);
  if (method === "GET" && eventsMatch) {
    return { status: 200, body: "__SSE__", headers: { "Content-Type": "text/event-stream" } };
  }

  // ── Analytics ────────────────────────────────────────

  // Overview routes must come before per-store regex routes,
  // otherwise /api/analytics/overview/realtime matches ([^/]+) as "overview"
  if (method === "GET" && pathname === "/api/analytics/overview/realtime") {
    return json(getOverviewRealtime());
  }

  if (method === "GET" && pathname === "/api/analytics/overview") {
    const period = params.get("period") ?? "TODAY";
    return json(getOverview(period));
  }

  if (method === "GET" && pathname === "/api/analytics/overview/throughput") {
    const range = params.get("range") ?? "D7";
    return json(getOverviewThroughput(range));
  }

  const realtimeMatch = pathname.match(/^\/api\/analytics\/([^/]+)\/realtime$/);
  if (method === "GET" && realtimeMatch) {
    return json(getRealtimeStats(realtimeMatch[1]));
  }

  const summaryMatch = pathname.match(/^\/api\/analytics\/([^/]+)\/summary$/);
  if (method === "GET" && summaryMatch) {
    const period = params.get("period") ?? "TODAY";
    return json(getStoreSummary(summaryMatch[1], period));
  }

  const peakHoursMatch = pathname.match(/^\/api\/analytics\/([^/]+)\/peak-hours$/);
  if (method === "GET" && peakHoursMatch) {
    const range = params.get("range") ?? "D7";
    return json(getPeakHours(peakHoursMatch[1], range));
  }

  const throughputMatch = pathname.match(/^\/api\/analytics\/([^/]+)\/throughput$/);
  if (method === "GET" && throughputMatch) {
    const range = params.get("range") ?? "D7";
    return json(getDailyThroughput(throughputMatch[1], range));
  }

  const waitDistMatch = pathname.match(/^\/api\/analytics\/([^/]+)\/wait-distribution$/);
  if (method === "GET" && waitDistMatch) {
    const period = params.get("period") ?? "TODAY";
    return json(getWaitDistribution(waitDistMatch[1], period));
  }

  const heatmapMatch = pathname.match(/^\/api\/analytics\/([^/]+)\/heatmap$/);
  if (method === "GET" && heatmapMatch) {
    const range = params.get("range") ?? "D7";
    return json(getHourlyHeatmap(heatmapMatch[1], range));
  }

  // No match — pass through
  return null;
}

export { DELAY };
