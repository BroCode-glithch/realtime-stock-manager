export type ApiRole = "admin" | "manager" | "staff";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
};

export type ApiProduct = {
  id: string;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  code?: string;
  color?: string;
  status?: string;
};

export type ApiTransaction = {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  quantityChanged: number;
  type: "in" | "out" | "adjust";
  channelId?: string | null;
  timestamp: number;
};

export type ApiAlert = {
  id: string;
  productId: string;
  productName: string;
  type: "low_stock" | "overstock" | "reorder";
  message: string;
  timestamp: number;
  read: boolean;
};

export type ApiDemandPoint = {
  productId: string;
  day: string;
  demand: number;
};

export type ApiChannel = {
  id: string;
  name: string;
  type: "retail" | "online" | "marketplace" | "mobile";
  enabled: boolean;
  notes?: string | null;
};

export type ApiSnapshot = {
  products: ApiProduct[];
  transactions: ApiTransaction[];
  alerts: ApiAlert[];
  demand: ApiDemandPoint[];
  channels: ApiChannel[];
  staticBaseline: { stockouts: number; excess: number };
};

export type ApiLoginRequest = {
  email: string;
  password: string;
};

export type ApiLoginResponse = {
  token: string;
  user: ApiUser;
};

export type ApiProductListResponse = {
  products: ApiProduct[];
  total: number;
  limit: number;
  offset: number;
};

export type ApiTransactionListResponse = {
  transactions: ApiTransaction[];
  total: number;
  limit: number;
  offset: number;
};

export type ApiAlertsListResponse = {
  alerts: ApiAlert[];
};

export type ApiAlertsReadResponse = {
  alerts: ApiAlert[];
  snapshot: ApiSnapshot;
};

export type ApiChannelListResponse = {
  channels: ApiChannel[];
};

export type ApiDailySalesPoint = {
  day: string;
  unitsSold: number;
  revenue: number;
};

export type ApiDailySalesReport = {
  series: ApiDailySalesPoint[];
  totalUnits: number;
  totalRevenue: number;
};

export type ApiProductMovementTotal = {
  productId: string;
  productName: string;
  unitsIn: number;
  unitsOut: number;
  net: number;
};

export type ApiInventorySummaryReport = {
  currentStockValue: number;
  stockoutRate: number;
  excessStockRate: number;
  productMovementTotals: ApiProductMovementTotal[];
};

export type ApiRevenueByProductPoint = {
  productId: string;
  productName: string;
  revenue: number;
};

export type ApiPerformanceReport = {
  stockoutRate: number;
  excessStockRate: number;
  currentStockValue: number;
  revenueByProduct: ApiRevenueByProductPoint[];
  revenueByDay: ApiDailySalesPoint[];
};

export type ApiErrorResponse = {
  error: string;
  details?: Array<{ field?: string; message?: string }>;
};

const DEFAULT_API_BASE_URL = "http://localhost:3001";

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function getRealtimeUrl() {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit;

  const base = new URL(getApiBaseUrl());
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/realtime";
  base.search = "";
  base.hash = "";
  return base.toString();
}

export function apiUrl(path: string) {
  const base = new URL(getApiBaseUrl());
  const basePath = base.pathname.replace(/\/$/, "");
  const baseHasApiPrefix = basePath.endsWith("/api");
  const [pathnameAndQuery, hash = ""] = path.split("#");
  const [rawPathname, rawSearch = ""] = pathnameAndQuery.split("?");
  const strippedPath = rawPathname.replace(/^\/api(?=\/|$)/, "") || "/";
  const normalizedPath = strippedPath.startsWith("/") ? strippedPath : `/${strippedPath}`;
  const apiPrefix = baseHasApiPrefix ? basePath : `${basePath}/api`;
  base.pathname = `${apiPrefix}${normalizedPath}`.replace(/\/+/g, "/");
  base.search = rawSearch ? `?${rawSearch}` : "";
  base.hash = hash ? `#${hash}` : "";
  return base.toString();
}

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (authToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${authToken}`);
  }
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await apiFetch(path, init);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
