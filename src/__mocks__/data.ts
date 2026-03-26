import type { AdminDto, AdminSessionDto, LoginHistoryDto } from "@/types/admin";
import type { TicketDto } from "@/types/queue";
import type { ServiceTypeDto, StoreDto, StoreSettingsDto } from "@/types/store";
import type {
  DailyCount,
  HeatmapCell,
  HourlyCount,
  RealtimeStatsResponse,
  StoreAnalyticsSummary,
  StoreSummaryResponse,
  WaitBucket,
} from "@/features/analytics/types";

// ── Stores ──────────────────────────────────────────────────
export const STORES: StoreDto[] = [
  {
    id: "s-001",
    name: "Downtown Branch",
    address: "123 Main St, Suite 200",
    isActive: true,
    allowJumpCall: true,
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-03-01T14:30:00Z",
  },
  {
    id: "s-002",
    name: "Airport Terminal 3",
    address: "456 Airport Rd, Gate B12",
    isActive: true,
    allowJumpCall: false,
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-20T11:00:00Z",
  },
  {
    id: "s-003",
    name: "Mall Kiosk",
    address: null,
    isActive: false,
    allowJumpCall: false,
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-03-10T16:00:00Z",
  },
  {
    id: "s-004",
    name: "Central Station Hub",
    address: "789 Railway Ave",
    isActive: true,
    allowJumpCall: true,
    createdAt: "2026-03-05T12:00:00Z",
    updatedAt: "2026-03-05T12:00:00Z",
  },
];

// ── Store settings ──────────────────────────────────────────
export const STORE_SETTINGS: Record<string, StoreSettingsDto> = {
  "s-001": {
    storeId: "s-001",
    maxQueueSize: 50,
    gracePeriodSec: 120,
    noShowAction: "REQUEUE",
    maxRequeues: 2,
    requeueOffset: 3,
    alertThreshold: 3,
    updatedAt: "2026-03-20T10:00:00Z",
  },
  "s-002": {
    storeId: "s-002",
    maxQueueSize: 100,
    gracePeriodSec: 180,
    noShowAction: "SKIP",
    maxRequeues: 0,
    requeueOffset: 0,
    alertThreshold: 5,
    updatedAt: "2026-02-20T11:00:00Z",
  },
  "s-003": {
    storeId: "s-003",
    maxQueueSize: 20,
    gracePeriodSec: 60,
    noShowAction: "SKIP",
    maxRequeues: 0,
    requeueOffset: 0,
    alertThreshold: 2,
    updatedAt: "2026-03-10T16:00:00Z",
  },
  "s-004": {
    storeId: "s-004",
    maxQueueSize: 0,
    gracePeriodSec: 90,
    noShowAction: "REQUEUE",
    maxRequeues: 3,
    requeueOffset: 5,
    alertThreshold: 3,
    updatedAt: "2026-03-05T12:00:00Z",
  },
};

// ── Service types ───────────────────────────────────────────
export const SERVICE_TYPES: Record<string, ServiceTypeDto[]> = {
  "s-001": [
    {
      id: "st-001",
      storeId: "s-001",
      name: "General Inquiry",
      prefix: "GEN",
      isActive: true,
      createdAt: "2026-01-15T09:00:00Z",
      updatedAt: "2026-01-15T09:00:00Z",
    },
    {
      id: "st-002",
      storeId: "s-001",
      name: "Returns & Exchange",
      prefix: "RET",
      isActive: true,
      createdAt: "2026-01-15T09:00:00Z",
      updatedAt: "2026-01-15T09:00:00Z",
    },
    {
      id: "st-003",
      storeId: "s-001",
      name: "VIP Service",
      prefix: "VIP",
      isActive: false,
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-03-15T08:00:00Z",
    },
  ],
  "s-002": [
    {
      id: "st-004",
      storeId: "s-002",
      name: "Check-in Assistance",
      prefix: "CHK",
      isActive: true,
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-02-01T10:00:00Z",
    },
    {
      id: "st-005",
      storeId: "s-002",
      name: "Baggage Claim",
      prefix: "BAG",
      isActive: true,
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-02-01T10:00:00Z",
    },
  ],
  "s-004": [
    {
      id: "st-006",
      storeId: "s-004",
      name: "Ticket Purchase",
      prefix: "TIX",
      isActive: true,
      createdAt: "2026-03-05T12:00:00Z",
      updatedAt: "2026-03-05T12:00:00Z",
    },
    {
      id: "st-007",
      storeId: "s-004",
      name: "Lost & Found",
      prefix: "LNF",
      isActive: true,
      createdAt: "2026-03-05T12:00:00Z",
      updatedAt: "2026-03-05T12:00:00Z",
    },
  ],
};

// ── Queue state per store ───────────────────────────────────
export const QUEUE_STATES: Record<string, string> = {
  "s-001": "ACTIVE",
  "s-002": "ACTIVE",
  "s-003": "ACTIVE",
  "s-004": "PAUSED",
};

// ── Admins ──────────────────────────────────────────────────
export const ADMINS: AdminDto[] = [
  {
    id: "sa-001",
    username: "superadmin",
    role: "ROLE_SUPER_ADMIN",
    storeId: null,
    storeName: null,
    isVerified: true,
    createdBy: null,
    verifiedBy: null,
    verifiedAt: "2026-01-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "a-001",
    username: "john_doe",
    role: "ROLE_ADMIN",
    storeId: "s-001",
    storeName: "Downtown Branch",
    isVerified: true,
    createdBy: "sa-001",
    verifiedBy: "sa-001",
    verifiedAt: "2026-01-20T10:00:00Z",
    createdAt: "2026-01-16T09:30:00Z",
    updatedAt: "2026-02-05T08:00:00Z",
  },
  {
    id: "a-002",
    username: "jane_smith",
    role: "ROLE_ADMIN",
    storeId: "s-001",
    storeName: "Downtown Branch",
    isVerified: false,
    createdBy: "sa-001",
    verifiedBy: null,
    verifiedAt: null,
    createdAt: "2026-03-10T14:00:00Z",
    updatedAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "a-003",
    username: "bob_wilson",
    role: "ROLE_ADMIN",
    storeId: "s-002",
    storeName: "Airport Terminal 3",
    isVerified: true,
    createdBy: "sa-001",
    verifiedBy: "sa-001",
    verifiedAt: "2026-02-05T15:00:00Z",
    createdAt: "2026-02-02T11:00:00Z",
    updatedAt: "2026-02-05T15:00:00Z",
  },
  {
    id: "a-004",
    username: "alice_chen",
    role: "ROLE_ADMIN",
    storeId: "s-002",
    storeName: "Airport Terminal 3",
    isVerified: true,
    createdBy: "sa-001",
    verifiedBy: "sa-001",
    verifiedAt: "2026-02-10T09:00:00Z",
    createdAt: "2026-02-08T16:00:00Z",
    updatedAt: "2026-02-10T09:00:00Z",
  },
  {
    id: "a-005",
    username: "carlos_reyes",
    role: "ROLE_ADMIN",
    storeId: "s-004",
    storeName: "Central Station Hub",
    isVerified: false,
    createdBy: "sa-001",
    verifiedBy: null,
    verifiedAt: null,
    createdAt: "2026-03-14T13:00:00Z",
    updatedAt: "2026-03-14T13:00:00Z",
  },
  {
    id: "sa-002",
    username: "maria_admin",
    role: "ROLE_SUPER_ADMIN",
    storeId: null,
    storeName: null,
    isVerified: true,
    createdBy: "sa-001",
    verifiedBy: "sa-001",
    verifiedAt: "2026-03-01T10:00:00Z",
    createdAt: "2026-02-28T08:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
  },
];

// ── Login history ───────────────────────────────────────────
export const LOGIN_HISTORY: Record<string, LoginHistoryDto[]> = {
  "sa-001": [
    { id: "lh-1", ipAddress: "192.168.1.10", success: true, createdAt: "2026-03-25T08:15:00Z" },
    { id: "lh-2", ipAddress: "192.168.1.10", success: true, createdAt: "2026-03-24T09:30:00Z" },
    { id: "lh-3", ipAddress: "10.0.0.5", success: false, createdAt: "2026-03-24T03:12:00Z" },
    { id: "lh-4", ipAddress: "192.168.1.10", success: true, createdAt: "2026-03-23T07:45:00Z" },
    { id: "lh-5", ipAddress: "172.16.0.1", success: true, createdAt: "2026-03-22T14:00:00Z" },
    { id: "lh-6", ipAddress: "10.0.0.99", success: false, createdAt: "2026-03-21T22:30:00Z" },
    { id: "lh-7", ipAddress: "192.168.1.10", success: true, createdAt: "2026-03-20T08:00:00Z" },
  ],
  "a-001": [
    { id: "lh-10", ipAddress: "192.168.1.20", success: true, createdAt: "2026-03-25T09:00:00Z" },
    { id: "lh-11", ipAddress: "192.168.1.20", success: true, createdAt: "2026-03-24T08:45:00Z" },
    { id: "lh-12", ipAddress: "192.168.1.20", success: false, createdAt: "2026-03-23T08:50:00Z" },
    { id: "lh-13", ipAddress: "192.168.1.20", success: true, createdAt: "2026-03-22T09:10:00Z" },
  ],
  "a-003": [
    { id: "lh-20", ipAddress: "10.10.0.50", success: true, createdAt: "2026-03-25T06:00:00Z" },
    { id: "lh-21", ipAddress: "10.10.0.50", success: true, createdAt: "2026-03-24T05:30:00Z" },
  ],
};

// ── Sessions ────────────────────────────────────────────────
export const SESSIONS: Record<string, AdminSessionDto[]> = {
  "sa-001": [
    {
      id: "sess-1",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      lastActive: "2026-03-25T08:20:00Z",
      createdAt: "2026-03-25T08:15:00Z",
      isCurrent: true,
    },
    {
      id: "sess-2",
      ipAddress: "172.16.0.1",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1",
      lastActive: "2026-03-24T22:00:00Z",
      createdAt: "2026-03-24T18:00:00Z",
      isCurrent: false,
    },
  ],
  "a-001": [
    {
      id: "sess-10",
      ipAddress: "192.168.1.20",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      lastActive: "2026-03-25T09:05:00Z",
      createdAt: "2026-03-25T09:00:00Z",
      isCurrent: true,
    },
  ],
  "a-003": [
    {
      id: "sess-20",
      ipAddress: "10.10.0.50",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      lastActive: "2026-03-25T06:10:00Z",
      createdAt: "2026-03-25T06:00:00Z",
      isCurrent: true,
    },
    {
      id: "sess-21",
      ipAddress: "10.10.0.51",
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      lastActive: "2026-03-24T20:00:00Z",
      createdAt: "2026-03-24T14:00:00Z",
      isCurrent: false,
    },
  ],
};

// ── Queue tickets (generated per-call via counter) ──────────
let ticketCounter = 100;

export function makeTicket(storeId: string, counterId?: string): TicketDto {
  ticketCounter++;
  const now = new Date().toISOString();
  return {
    id: `t-${storeId}-${ticketCounter}`,
    number: `${counterId ? counterId + "-" : ""}${ticketCounter}`,
    status: "CALLED",
    issuedAt: new Date(Date.now() - 300_000).toISOString(),
    calledAt: now,
    position: null,
  };
}

// Pre-made tickets for lookup
export const EXISTING_TICKETS: Record<string, TicketDto> = {
  "t-s-001-42": {
    id: "t-s-001-42",
    number: "42",
    status: "WAITING",
    issuedAt: new Date(Date.now() - 600_000).toISOString(),
    calledAt: null,
    position: 3,
  },
  "t-s-001-38": {
    id: "t-s-001-38",
    number: "38",
    status: "SERVED",
    issuedAt: new Date(Date.now() - 1_800_000).toISOString(),
    calledAt: new Date(Date.now() - 900_000).toISOString(),
    position: null,
  },
  "t-s-002-15": {
    id: "t-s-002-15",
    number: "15",
    status: "WAITING",
    issuedAt: new Date(Date.now() - 120_000).toISOString(),
    calledAt: null,
    position: 1,
  },
};

// Mutable queue sizes per store (decremented on callNext)
export const QUEUE_SIZES: Record<string, number> = {
  "s-001": 7,
  "s-002": 3,
  "s-003": 0,
  "s-004": 12,
};

// Generate waiting tickets for each store based on QUEUE_SIZES
function generateWaitingTickets(): Record<string, TicketDto[]> {
  const result: Record<string, TicketDto[]> = {};
  for (const [storeId, count] of Object.entries(QUEUE_SIZES)) {
    const tickets: TicketDto[] = [];
    for (let i = 0; i < count; i++) {
      const num = 90 + i;
      tickets.push({
        id: `t-${storeId}-${num}`,
        number: String(num),
        status: "WAITING",
        issuedAt: new Date(Date.now() - (count - i) * 180_000).toISOString(),
        calledAt: null,
        position: i + 1,
      });
    }
    result[storeId] = tickets;
  }
  return result;
}

export const WAITING_TICKETS = generateWaitingTickets();

// ── Analytics helpers ───────────────────────────────────────
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function daysAgo(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString().slice(0, 10);
}

export function getRealtimeStats(storeId: string): RealtimeStatsResponse {
  const sizes: Record<string, RealtimeStatsResponse> = {
    "s-001": { currentQueueSize: 7, currentServingCount: 2, ticketsIssuedToday: 34, estimatedAvgWaitMinutes: 8.5 },
    "s-002": { currentQueueSize: 3, currentServingCount: 1, ticketsIssuedToday: 18, estimatedAvgWaitMinutes: 5.2 },
    "s-003": { currentQueueSize: 0, currentServingCount: 0, ticketsIssuedToday: 0, estimatedAvgWaitMinutes: null },
    "s-004": { currentQueueSize: 12, currentServingCount: 3, ticketsIssuedToday: 56, estimatedAvgWaitMinutes: 12.0 },
  };
  return sizes[storeId] ?? { currentQueueSize: 0, currentServingCount: 0, ticketsIssuedToday: 0, estimatedAvgWaitMinutes: null };
}

export function getStoreSummary(storeId: string, period: string): StoreSummaryResponse {
  const base: Record<string, Omit<StoreSummaryResponse, "period">> = {
    "s-001": {
      totalIssued: 245, totalCompleted: 218, totalCancelled: 15, totalSkipped: 12,
      avgWaitSeconds: 510, avgServiceSeconds: 340, medianWaitSeconds: 480,
      peakHour: 11, cancelRate: 0.061, skipRate: 0.049,
    },
    "s-002": {
      totalIssued: 130, totalCompleted: 119, totalCancelled: 8, totalSkipped: 3,
      avgWaitSeconds: 312, avgServiceSeconds: 420, medianWaitSeconds: 290,
      peakHour: 14, cancelRate: 0.062, skipRate: 0.023,
    },
    "s-004": {
      totalIssued: 380, totalCompleted: 342, totalCancelled: 22, totalSkipped: 16,
      avgWaitSeconds: 720, avgServiceSeconds: 280, medianWaitSeconds: 680,
      peakHour: 9, cancelRate: 0.058, skipRate: 0.042,
    },
  };
  const data = base[storeId] ?? {
    totalIssued: 0, totalCompleted: 0, totalCancelled: 0, totalSkipped: 0,
    avgWaitSeconds: null, avgServiceSeconds: null, medianWaitSeconds: null,
    peakHour: null, cancelRate: null, skipRate: null,
  };
  return { period, ...data };
}

export function getPeakHours(storeId: string, range: string): { range: string; hours: HourlyCount[] } {
  const hours: HourlyCount[] = Array.from({ length: 24 }, (_, h) => {
    let base = 0;
    if (h >= 8 && h <= 18) base = 5 + Math.floor(Math.random() * 15);
    if (h >= 10 && h <= 13) base += 8;
    if (h >= 16 && h <= 17) base += 5;
    return { hour: h, avgTickets: base };
  });
  return { range, hours };
}

export function getDailyThroughput(storeId: string, range: string): { range: string; days: DailyCount[] } {
  const numDays = range === "D7" ? 7 : range === "D30" ? 30 : 90;
  const days: DailyCount[] = Array.from({ length: numDays }, (_, i) => {
    const issued = 20 + Math.floor(Math.random() * 40);
    const completed = Math.floor(issued * (0.85 + Math.random() * 0.1));
    const cancelled = Math.floor(issued * (0.03 + Math.random() * 0.05));
    const skipped = Math.max(0, issued - completed - cancelled);
    return {
      date: daysAgo(numDays - 1 - i),
      issued,
      completed,
      cancelled,
      skipped,
    };
  });
  return { range, days };
}

export function getOverviewThroughput(range: string): { range: string; days: DailyCount[] } {
  const numDays = range === "D7" ? 7 : range === "D30" ? 30 : 90;
  const days: DailyCount[] = Array.from({ length: numDays }, (_, i) => {
    // Aggregate across all stores — higher totals
    const issued = 60 + Math.floor(Math.random() * 80);
    const completed = Math.floor(issued * (0.85 + Math.random() * 0.1));
    const cancelled = Math.floor(issued * (0.03 + Math.random() * 0.05));
    const skipped = Math.max(0, issued - completed - cancelled);
    return {
      date: daysAgo(numDays - 1 - i),
      issued,
      completed,
      cancelled,
      skipped,
    };
  });
  return { range, days };
}

export function getOverviewRealtime() {
  return {
    activeStores: 3,
    totalQueueSize: 22,
    totalServingCount: 6,
    totalIssuedToday: 108,
    estimatedAvgWaitMinutes: 8.6,
  };
}

export function getOverview(period: string): {
  period: string;
  totalStores: number;
  totalIssued: number;
  totalCompleted: number;
  avgWaitSeconds: number | null;
  stores: StoreAnalyticsSummary[];
} {
  return {
    period,
    totalStores: 4,
    totalIssued: 755,
    totalCompleted: 679,
    avgWaitSeconds: 514,
    stores: [
      { storeId: "s-004", storeName: "Central Station Hub", issued: 380, completed: 342, cancelled: 22, skipped: 16, avgWaitSeconds: 720 },
      { storeId: "s-001", storeName: "Downtown Branch", issued: 245, completed: 218, cancelled: 15, skipped: 12, avgWaitSeconds: 510 },
      { storeId: "s-002", storeName: "Airport Terminal 3", issued: 130, completed: 119, cancelled: 8, skipped: 3, avgWaitSeconds: 312 },
      { storeId: "s-003", storeName: "Mall Kiosk", issued: 0, completed: 0, cancelled: 0, skipped: 0, avgWaitSeconds: null },
    ],
  };
}

export function getWaitDistribution(storeId: string, period: string): { period: string; buckets: WaitBucket[] } {
  const buckets: WaitBucket[] = [
    { label: "0-5", minMinutes: 0, maxMinutes: 5, count: 45 + Math.floor(Math.random() * 30) },
    { label: "5-10", minMinutes: 5, maxMinutes: 10, count: 30 + Math.floor(Math.random() * 20) },
    { label: "10-15", minMinutes: 10, maxMinutes: 15, count: 15 + Math.floor(Math.random() * 15) },
    { label: "15-20", minMinutes: 15, maxMinutes: 20, count: 5 + Math.floor(Math.random() * 10) },
    { label: "20+", minMinutes: 20, maxMinutes: null, count: 2 + Math.floor(Math.random() * 5) },
  ];

  if (storeId === "s-003") {
    return { period, buckets: buckets.map((b) => ({ ...b, count: 0 })) };
  }
  return { period, buckets };
}

export function getHourlyHeatmap(storeId: string, range: string): { range: string; cells: HeatmapCell[] } {
  const cells: HeatmapCell[] = [];
  for (let dow = 1; dow <= 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      let avg = 0;
      if (hour >= 8 && hour <= 18) {
        avg = 2 + Math.random() * 10;
        // Weekend bump
        if (dow >= 6) avg *= 1.3;
        // Lunch rush
        if (hour >= 11 && hour <= 13) avg *= 1.5;
        // Afternoon peak
        if (hour >= 16 && hour <= 17) avg *= 1.2;
      }
      cells.push({ dayOfWeek: dow, hour, avgTickets: Number(avg.toFixed(1)) });
    }
  }

  if (storeId === "s-003") {
    return { range, cells: cells.map((c) => ({ ...c, avgTickets: 0 })) };
  }
  return { range, cells };
}
