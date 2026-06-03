import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

import {
  apiJson,
  apiFetch,
  setAuthToken,
  type ApiChannel,
  type ApiChannelListResponse,
  type ApiDailySalesReport,
  type ApiInventorySummaryReport,
  type ApiLoginResponse,
  type ApiPerformanceReport,
  type ApiProduct,
  type ApiProductListResponse,
  type ApiSnapshot,
  type ApiTransactionListResponse,
  type ApiAlertsListResponse,
  type ApiAlertsReadResponse,
  type ApiAlertSettings,
  type ApiSettingsPatchResponse,
  type ApiSettingsResponse,
  type ApiSettingsAuditListResponse,
  type ApiSettingsAuditEntry,
} from "@/lib/inventory-api";

export type Role = "admin" | "manager" | "staff";

export type Capability =
  | "view_dashboard"
  | "view_inventory"
  | "create_product"
  | "update_product"
  | "delete_product"
  | "stock_in"
  | "stock_out"
  | "view_sales"
  | "view_alerts"
  | "view_reports"
  | "view_system_docs"
  | "view_guide"
  | "import_products"
  | "manage_channels"
  | "reset_data"
  | "view_profile";

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: [
    "view_dashboard",
    "view_inventory",
    "create_product",
    "update_product",
    "delete_product",
    "stock_in",
    "stock_out",
    "view_sales",
    "view_alerts",
    "view_reports",
    "view_system_docs",
    "view_guide",
    "import_products",
    "manage_channels",
    "reset_data",
    "view_profile",
  ],
  manager: [
    "view_dashboard",
    "view_inventory",
    "create_product",
    "update_product",
    "stock_in",
    "stock_out",
    "view_sales",
    "view_alerts",
    "view_reports",
    "view_system_docs",
    "view_guide",
    "import_products",
    "manage_channels",
    "view_profile",
  ],
  staff: [
    "view_dashboard",
    "view_inventory",
    "stock_in",
    "stock_out",
    "view_sales",
    "view_alerts",
    "view_guide",
    "view_profile",
  ],
};

export function can(role: Role | undefined | null, capability: Capability) {
  return ROLE_CAPABILITIES[role ?? "staff"].includes(capability);
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number; // naira (₦)
  color?: string;
  code?: string;
  status?: string;
}

export type SalesChannel = ApiChannel;

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName?: string;
  quantityChanged: number;
  type: "in" | "out" | "adjust";
  channelId?: string | null;
  timestamp: number;
}

export interface Alert {
  id: string;
  productId: string;
  productName: string;
  type: "low_stock" | "overstock" | "reorder";
  message: string;
  timestamp: number;
  read: boolean;
}

export interface DemandPoint {
  productId: string;
  day: string;
  demand: number;
}

export type AlertSettings = ApiAlertSettings;

export type DailySalesReport = ApiDailySalesReport;
export type InventorySummaryReport = ApiInventorySummaryReport;
export type PerformanceReport = ApiPerformanceReport;

export type ProductWrite = Omit<Product, "id">;

const defaultAlertSettings: AlertSettings = {
  lowStockRatio: 1,
  reorderRatio: 0.5,
  overstockRatio: 2,
  enableLowStock: true,
  enableReorder: true,
  enableOverstock: true,
};

const seedProducts: Product[] = [
  { id: "p1", name: "Wireless Mouse", category: "Electronics", supplier: "TechCorp", quantity: 42, reorderLevel: 20, unitPrice: 18500, color: "Black", code: "WM-001" },
  { id: "p2", name: "USB-C Cable", category: "Electronics", supplier: "TechCorp", quantity: 8, reorderLevel: 30, unitPrice: 4500, color: "White", code: "UC-002" },
  { id: "p3", name: "Mechanical Keyboard", category: "Electronics", supplier: "KeyMakers", quantity: 15, reorderLevel: 10, unitPrice: 72000, color: "Grey", code: "MK-003" },
  { id: "p4", name: "Notebook A5", category: "Stationery", supplier: "PaperCo", quantity: 120, reorderLevel: 40, unitPrice: 2200, color: "Blue", code: "NB-004" },
  { id: "p5", name: "Ballpoint Pen", category: "Stationery", supplier: "PaperCo", quantity: 280, reorderLevel: 100, unitPrice: 650, color: "Blue", code: "BP-005" },
  { id: "p6", name: "Desk Lamp", category: "Office", supplier: "LumaWorks", quantity: 5, reorderLevel: 12, unitPrice: 24500, color: "Silver", code: "DL-006" },
  { id: "p7", name: "Office Chair", category: "Furniture", supplier: "SitWell", quantity: 90, reorderLevel: 15, unitPrice: 145000, color: "Black", code: "OC-007" },
  { id: "p8", name: "Monitor 27\"", category: "Electronics", supplier: "ViewPlus", quantity: 22, reorderLevel: 8, unitPrice: 210000, color: "Black", code: "MN-008" },
];

const seedChannels: SalesChannel[] = [
  { id: "c1", name: "Lagos Flagship Store", type: "retail", enabled: true, notes: "Primary walk-in branch" },
  { id: "c2", name: "Online Store (Web)", type: "online", enabled: true, notes: "Primary ecommerce channel" },
  { id: "c3", name: "Jumia Marketplace", type: "marketplace", enabled: false, notes: "Third-party marketplace" },
  { id: "c4", name: "WhatsApp Catalog", type: "mobile", enabled: true, notes: "Mobile commerce channel" },
];

export function formatNaira(n: number) {
  return "₦" + (n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export function productStatus(p: Product): "in_stock" | "low" | "out" {
  if (p.quantity <= 0) return "out";
  if (p.quantity <= p.reorderLevel) return "low";
  return "in_stock";
}

export function allTimeMovement(transactions: Transaction[], productId: string) {
  let inQty = 0;
  let outQty = 0;
  for (const transaction of transactions) {
    if (transaction.productId !== productId) continue;
    if (transaction.quantityChanged > 0) inQty += transaction.quantityChanged;
    else outQty += -transaction.quantityChanged;
  }
  return { inQty, outQty };
}

function generateDemandHistory(): DemandPoint[] {
  const points: DemandPoint[] = [];
  const now = Date.now();
  for (const product of seedProducts) {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const day = `${d.getMonth() + 1}/${d.getDate()}`;
      points.push({
        productId: product.id,
        day,
        demand: Math.max(0, Math.round(5 + Math.random() * 12 + Math.sin(i / 2) * 3)),
      });
    }
  }
  return points;
}

interface State {
  token: string | null;
  user: User | null;
  products: Product[];
  transactions: Transaction[];
  alerts: Alert[];
  demand: DemandPoint[];
  channels: SalesChannel[];
  alertSettings: AlertSettings;
  settingsAudit: ApiSettingsAuditEntry[];
  staticBaseline: { stockouts: number; excess: number };
  simRunning: boolean;
  simIntervalMs: number;
  setSimRunning: (v: boolean) => void;
  setSimIntervalMs: (ms: number) => void;
  syncFromServer: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addProduct: (product: ProductWrite) => Promise<void>;
  updateProduct: (id: string, patch: Partial<ProductWrite>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  recordTransaction: (productId: string, qty: number, type: Transaction["type"], channelId?: string | null) => Promise<void>;
  markAlertsRead: (ids?: string[]) => Promise<void>;
  tickSimulation: (seed?: number) => Promise<void>;
  bulkImport: (rows: ProductWrite[]) => Promise<void>;
  resetSeed: () => Promise<void>;
  loadChannels: () => Promise<void>;
  createChannel: (channel: Omit<SalesChannel, "id">) => Promise<void>;
  updateChannel: (id: string, patch: Partial<Omit<SalesChannel, "id">>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  loadAlertSettings: () => Promise<void>;
  saveAlertSettings: (patch: Partial<AlertSettings>) => Promise<void>;
  loadSettingsAudit: (limit?: number, offset?: number) => Promise<void>;
  can: (capability: Capability) => boolean;
}

type Snapshot = Pick<State, "products" | "transactions" | "alerts" | "demand" | "channels" | "alertSettings" | "staticBaseline">;

function mergeSnapshot(setState: (partial: Partial<State>) => void, snapshot: Snapshot) {
  setState(snapshot);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeAlertSettings(input: Partial<AlertSettings> | null | undefined): AlertSettings {
  const rawLowStock = Number((input as { lowStockRatio?: number } | undefined)?.lowStockRatio ?? 1);
  const rawReorder = Number((input as { reorderRatio?: number } | undefined)?.reorderRatio ?? 0.5);
  const lowStockRatio = clampNumber(rawLowStock, 0, 2);
  const reorderRatio = clampNumber(rawReorder, 0, 1.5);

  return {
    lowStockRatio,
    reorderRatio: Math.min(reorderRatio, lowStockRatio),
    overstockRatio: clampNumber(Number((input as { overstockRatio?: number } | undefined)?.overstockRatio ?? 2), 1, 5),
    enableLowStock: Boolean((input as { enableLowStock?: boolean } | undefined)?.enableLowStock ?? true),
    enableReorder: Boolean((input as { enableReorder?: boolean } | undefined)?.enableReorder ?? true),
    enableOverstock: Boolean((input as { enableOverstock?: boolean } | undefined)?.enableOverstock ?? true),
  };
}

function evalAlerts(products: Product[], demand: DemandPoint[], config: AlertSettings): Alert[] {
  const alerts: Alert[] = [];
  for (const product of products) {
    const recent = demand.filter((entry) => entry.productId === product.id).slice(-7);
    const avg = recent.reduce((sum, entry) => sum + entry.demand, 0) / Math.max(1, recent.length);
    const lowThreshold = Math.round(product.reorderLevel * config.lowStockRatio);
    const reorderThreshold = Math.round(product.reorderLevel * config.reorderRatio);
    const overstockThreshold = Math.round(product.reorderLevel * config.overstockRatio);

    if (config.enableReorder && product.quantity <= reorderThreshold) {
      alerts.push({
        id: `a-${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        type: "reorder",
        message: `${product.name} at ${product.quantity} units. Ratio threshold ${reorderThreshold} (reorderRatio=${config.reorderRatio}).`,
        timestamp: Date.now(),
        read: false,
      });
      continue;
    }

    if (config.enableLowStock && product.quantity <= lowThreshold) {
      alerts.push({
        id: `a-${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        type: "low_stock",
        message: `${product.name} at ${product.quantity} units. Low-stock threshold ${lowThreshold}. Avg demand ${avg.toFixed(1)}/day.`,
        timestamp: Date.now(),
        read: false,
      });
    } else if (config.enableOverstock && product.quantity > overstockThreshold) {
      alerts.push({
        id: `a-${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        type: "overstock",
        message: `${product.name} overstocked at ${product.quantity} units. Overstock threshold ${overstockThreshold}.`,
        timestamp: Date.now(),
        read: false,
      });
    }
  }
  return alerts;
}

async function syncSnapshot(set: (partial: Partial<State>) => void, get: () => State) {
  const [snapshot, products, transactions, alerts, channels] = await Promise.all([
    apiJson<ApiSnapshot>("/api/state"),
    apiJson<ApiProductListResponse>("/api/products?limit=200&offset=0"),
    apiJson<ApiTransactionListResponse>("/api/transactions?limit=200&offset=0"),
    apiJson<ApiAlertsListResponse>("/api/alerts"),
    apiJson<ApiChannelListResponse>("/api/channels"),
  ]);

  const nextState: Partial<State> = {};
  const resolvedProducts = products?.products ?? snapshot?.products;
  const resolvedTransactions = transactions?.transactions ?? snapshot?.transactions;
  const resolvedAlerts = alerts?.alerts ?? snapshot?.alerts;
  const resolvedChannels = channels?.channels ?? snapshot?.channels;

  if (resolvedProducts) nextState.products = resolvedProducts as Product[];
  if (resolvedTransactions) nextState.transactions = resolvedTransactions as Transaction[];
  if (resolvedAlerts) nextState.alerts = resolvedAlerts as Alert[];
  if (snapshot?.demand) nextState.demand = snapshot.demand as DemandPoint[];
  if (resolvedChannels) nextState.channels = resolvedChannels as SalesChannel[];
  if (snapshot?.alertSettings) nextState.alertSettings = sanitizeAlertSettings(snapshot.alertSettings);
  if (snapshot?.staticBaseline) nextState.staticBaseline = snapshot.staticBaseline;

  if (Object.keys(nextState).length > 0) {
    set(nextState);
  } else {
    void get();
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      products: seedProducts,
      transactions: [],
      alerts: [],
      demand: generateDemandHistory(),
      channels: seedChannels,
      alertSettings: defaultAlertSettings,
      settingsAudit: [],
      staticBaseline: { stockouts: 18, excess: 24 },
      simRunning: true,
      simIntervalMs: 4000,
      setSimRunning: (v) => set({ simRunning: v }),
      setSimIntervalMs: (ms) => set({ simIntervalMs: Math.max(500, ms) }),

      syncFromServer: async () => {
        try {
          await syncSnapshot(set, get);
        } catch {
          // Keep the local prototype working when the Node service is unavailable.
        }
      },

      login: async (email, password) => {
        try {
          const response = await apiFetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          if (!response.ok) {
            toast.error("Login failed. Check your credentials.");
            return false;
          }
          const payload = (await response.json()) as ApiLoginResponse;
          setAuthToken(payload.token);
          set({
            token: payload.token,
            user: {
              id: payload.user.id,
              email: payload.user.email,
              role: payload.user.role,
              name: payload.user.name,
            },
          });
          await syncSnapshot(set, get);
          toast.success(`Welcome back, ${payload.user.name}!`);
          return true;
        } catch {
          toast.error("Login failed. Check your credentials.");
          return false;
        }
      },

      logout: () => {
        setAuthToken(null);
        set({ token: null, user: null });
        toast.success("Signed out successfully.");
      },

      addProduct: async (product) => {
        const response = await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(product),
        });
        if (!response.ok) {
          toast.error("Product creation failed.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Product created successfully.");
      },

      updateProduct: async (id, patch) => {
        const response = await apiFetch(`/api/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        if (!response.ok) {
          toast.error("Product update failed.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Product updated successfully.");
      },

      deleteProduct: async (id) => {
        const response = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
        if (!response.ok) {
          toast.error("Product deletion failed.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Product deleted successfully.");
      },

      recordTransaction: async (productId, qty, type, channelId) => {
        const user = get().user;
        const response = await apiFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            productId,
            qty,
            type,
            channelId,
            userId: user?.id,
            userName: user?.name,
          }),
        });
        if (!response.ok) {
          toast.error("Inventory transaction failed.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success(type === "out" ? "Sale recorded." : type === "in" ? "Stock received." : "Inventory adjusted.");
      },

      markAlertsRead: async (ids) => {
        const response = await apiFetch("/api/alerts/read", {
          method: "POST",
          body: JSON.stringify(ids?.length ? { ids } : {}),
        });
        if (!response.ok) {
          toast.error("Unable to mark alerts read.");
          return;
        }
        const payload = (await response.json().catch(() => null)) as ApiAlertsReadResponse | null;
        if (payload?.snapshot) {
          mergeSnapshot(set, payload.snapshot as Snapshot);
        } else {
          await syncSnapshot(set, get);
        }
        toast.success("Alerts marked read.");
      },

      tickSimulation: async (seed) => {
        const response = await apiFetch("/api/tick", {
          method: "POST",
          body: seed !== undefined ? JSON.stringify({ seed }) : undefined,
        });
        if (!response.ok) return;
        await syncSnapshot(set, get);
      },

      bulkImport: async (rows) => {
        const response = await apiFetch("/api/import", {
          method: "POST",
          body: JSON.stringify({ products: rows }),
        });
        if (!response.ok) {
          toast.error("Product import failed.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Products imported successfully.");
      },

      resetSeed: async () => {
        const response = await apiFetch("/api/reset", { method: "POST" });
        if (!response.ok) {
          toast.error("Reset failed.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Data reset successfully.");
      },

      loadChannels: async () => {
        const payload = await apiJson<ApiChannelListResponse>("/api/channels");
        if (!payload) return;
        set({ channels: payload.channels });
      },

      createChannel: async (channel) => {
        const response = await apiFetch("/api/channels", {
          method: "POST",
          body: JSON.stringify(channel),
        });
        if (!response.ok) {
          toast.error("Failed to create channel.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Channel created successfully.");
      },

      updateChannel: async (id, patch) => {
        const response = await apiFetch(`/api/channels/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        if (!response.ok) {
          toast.error("Failed to update channel.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Channel updated successfully.");
      },

      deleteChannel: async (id) => {
        const response = await apiFetch(`/api/channels/${id}`, { method: "DELETE" });
        if (!response.ok) {
          toast.error("Failed to delete channel.");
          return;
        }
        await syncSnapshot(set, get);
        toast.success("Channel deleted successfully.");
      },

      loadAlertSettings: async () => {
        const payload = await apiJson<ApiSettingsResponse>("/api/settings");
        if (!payload?.alertSettings) return;
        const next = sanitizeAlertSettings(payload.alertSettings);
        const current = get();
        set({
          alertSettings: next,
          alerts: evalAlerts(current.products, current.demand, next),
        });
      },

      saveAlertSettings: async (patch) => {
        const current = get();
        const next = sanitizeAlertSettings({ ...current.alertSettings, ...patch });

        const response = await apiFetch("/api/settings", {
          method: "PATCH",
          body: JSON.stringify(patch),
        }).catch(() => null);

        if (response?.ok) {
          const payload = (await response.json().catch(() => null)) as ApiSettingsPatchResponse | null;
          if (payload?.snapshot) {
            mergeSnapshot(set, payload.snapshot as Snapshot);
            if (payload.audit) {
              set((state) => ({ settingsAudit: [payload.audit as ApiSettingsAuditEntry, ...state.settingsAudit].slice(0, 50) }));
            }
          } else {
            const active = get();
            set({
              alertSettings: sanitizeAlertSettings(payload?.alertSettings ?? next),
              alerts: evalAlerts(active.products, active.demand, next),
            });
            if (payload?.audit) {
              set((state) => ({ settingsAudit: [payload.audit as ApiSettingsAuditEntry, ...state.settingsAudit].slice(0, 50) }));
            }
          }
          toast.success("Alert settings updated.");
          return;
        }

        const active = get();
        set({
          alertSettings: next,
          alerts: evalAlerts(active.products, active.demand, next),
        });
        toast.success("Alert settings saved locally.");
      },

      loadSettingsAudit: async (limit = 20, offset = 0) => {
        const payload = await apiJson<ApiSettingsAuditListResponse>(`/api/settings/audit?limit=${limit}&offset=${offset}`);
        if (!payload?.entries) return;
        set({ settingsAudit: payload.entries });
      },

      can: (capability) => can(get().user?.role ?? "staff", capability),
    }),
    {
      name: "inv-store-v2",
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    }
  )
);
