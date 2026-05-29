import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiJson, apiFetch } from "@/lib/inventory-api";

export type Role = "admin" | "manager" | "staff";

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
  unitPrice: number;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  quantityChanged: number;
  type: "in" | "out" | "adjust";
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

const seedProducts: Product[] = [
  { id: "p1", name: "Wireless Mouse", category: "Electronics", supplier: "TechCorp", quantity: 42, reorderLevel: 20, unitPrice: 24.99 },
  { id: "p2", name: "USB-C Cable", category: "Electronics", supplier: "TechCorp", quantity: 8, reorderLevel: 30, unitPrice: 9.99 },
  { id: "p3", name: "Mechanical Keyboard", category: "Electronics", supplier: "KeyMakers", quantity: 15, reorderLevel: 10, unitPrice: 89.0 },
  { id: "p4", name: "Notebook A5", category: "Stationery", supplier: "PaperCo", quantity: 120, reorderLevel: 40, unitPrice: 4.5 },
  { id: "p5", name: "Ballpoint Pen", category: "Stationery", supplier: "PaperCo", quantity: 280, reorderLevel: 100, unitPrice: 1.2 },
  { id: "p6", name: "Desk Lamp", category: "Office", supplier: "LumaWorks", quantity: 5, reorderLevel: 12, unitPrice: 34.5 },
  { id: "p7", name: "Office Chair", category: "Furniture", supplier: "SitWell", quantity: 90, reorderLevel: 15, unitPrice: 189.0 },
  { id: "p8", name: "Monitor 27\"", category: "Electronics", supplier: "ViewPlus", quantity: 22, reorderLevel: 8, unitPrice: 279.0 },
];

function generateDemandHistory(): DemandPoint[] {
  const pts: DemandPoint[] = [];
  const now = Date.now();
  for (const p of seedProducts) {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const day = `${d.getMonth() + 1}/${d.getDate()}`;
      pts.push({
        productId: p.id,
        day,
        demand: Math.max(0, Math.round(5 + Math.random() * 12 + Math.sin(i / 2) * 3)),
      });
    }
  }
  return pts;
}

interface State {
  user: User | null;
  products: Product[];
  transactions: Transaction[];
  alerts: Alert[];
  demand: DemandPoint[];
  staticBaseline: { stockouts: number; excess: number };
  simRunning: boolean;
  simIntervalMs: number;
  setSimRunning: (v: boolean) => void;
  setSimIntervalMs: (ms: number) => void;
  syncFromServer: () => Promise<void>;
  login: (email: string, role: Role) => void;
  logout: () => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordTransaction: (productId: string, qty: number, type: Transaction["type"]) => void;
  markAlertsRead: () => void;
  tickSimulation: () => void;
  bulkImport: (rows: Omit<Product, "id">[]) => void;
  resetSeed: () => void;
}


type Snapshot = Pick<State, "products" | "transactions" | "alerts" | "demand" | "staticBaseline">;

function mergeSnapshot(setState: (partial: Partial<State>) => void, snapshot: Snapshot) {
  setState(snapshot);
}

function evalAlerts(products: Product[], demand: DemandPoint[]): Alert[] {
  const alerts: Alert[] = [];
  for (const p of products) {
    const recent = demand.filter((d) => d.productId === p.id).slice(-7);
    const avg = recent.reduce((a, b) => a + b.demand, 0) / Math.max(1, recent.length);
    const adaptiveThreshold = Math.max(p.reorderLevel, Math.round(avg * 3));
    if (p.quantity <= adaptiveThreshold) {
      alerts.push({
        id: `a-${p.id}-${Date.now()}`,
        productId: p.id,
        productName: p.name,
        type: p.quantity <= p.reorderLevel ? "low_stock" : "reorder",
        message: `${p.name} at ${p.quantity} units. Avg demand ${avg.toFixed(1)}/day. Suggested reorder.`,
        timestamp: Date.now(),
        read: false,
      });
    } else if (p.quantity > adaptiveThreshold * 5 && p.quantity > 50) {
      alerts.push({
        id: `a-${p.id}-${Date.now()}`,
        productId: p.id,
        productName: p.name,
        type: "overstock",
        message: `${p.name} overstocked at ${p.quantity} units (avg demand ${avg.toFixed(1)}/day).`,
        timestamp: Date.now(),
        read: false,
      });
    }
  }
  return alerts;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      products: seedProducts,
      transactions: [],
      alerts: [],
      demand: generateDemandHistory(),
      staticBaseline: { stockouts: 18, excess: 24 },
      simRunning: true,
      simIntervalMs: 4000,
      setSimRunning: (v) => set({ simRunning: v }),
      setSimIntervalMs: (ms) => set({ simIntervalMs: Math.max(500, ms) }),

      syncFromServer: async () => {
        try {
          const snapshot = await apiJson<Snapshot>("/api/state");
          if (!snapshot) return;
          mergeSnapshot(set, snapshot);
        } catch {
          // Keep the local prototype working when the Node service is unavailable.
        }
      },

      login: (email, role) => {
        const name = email.split("@")[0].replace(/[._]/g, " ");
        set({
          user: {
            id: "u-" + Math.random().toString(36).slice(2, 8),
            email,
            role,
            name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
          },
        });
      },
      logout: () => set({ user: null }),

      addProduct: (p) => {
        void (async () => {
          const response = await apiFetch("/api/products", { method: "POST", body: JSON.stringify(p) });
          if (!response.ok) return;
          const snapshot = (await response.json().catch(() => null)) as Snapshot | null;
          if (snapshot) {
            mergeSnapshot(set, snapshot);
            return;
          }
          await get().syncFromServer();
        })();
      },
      updateProduct: (id, patch) =>
        void (async () => {
          const response = await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
          if (!response.ok) return;
          const snapshot = (await response.json().catch(() => null)) as Snapshot | null;
          if (snapshot) {
            mergeSnapshot(set, snapshot);
            return;
          }
          await get().syncFromServer();
        })(),
      deleteProduct: (id) =>
        void (async () => {
          const response = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
          if (!response.ok) return;
          const snapshot = (await response.json().catch(() => null)) as Snapshot | null;
          if (snapshot) {
            mergeSnapshot(set, snapshot);
            return;
          }
          await get().syncFromServer();
        })(),

      recordTransaction: (productId, qty, type) => {
        void (async () => {
          const response = await apiFetch("/api/transactions", {
            method: "POST",
            body: JSON.stringify({ productId, qty, type }),
          });
          if (!response.ok) return;
          const snapshot = (await response.json().catch(() => null)) as Snapshot | null;
          if (snapshot) {
            mergeSnapshot(set, snapshot);
            return;
          }
          await get().syncFromServer();
        })();
      },

      markAlertsRead: () =>
        void (async () => {
          const response = await apiFetch("/api/alerts/read", { method: "POST" });
          if (!response.ok) return;
          const snapshot = (await response.json().catch(() => null)) as Snapshot | null;
          if (snapshot) {
            mergeSnapshot(set, snapshot);
            return;
          }
          await get().syncFromServer();
        })(),

      tickSimulation: () => {
        void (async () => {
          const response = await apiFetch("/api/tick", { method: "POST" });
          if (!response.ok) return;
          const snapshot = (await response.json().catch(() => null)) as Snapshot | null;
          if (snapshot) {
            mergeSnapshot(set, snapshot);
            return;
          }
          await get().syncFromServer();
        })();
      },

      bulkImport: (rows) => {
        void (async () => {
          for (const row of rows) {
            await apiFetch("/api/products", { method: "POST", body: JSON.stringify(row) });
          }
          await get().syncFromServer();
        })();
      },


      resetSeed: () =>
        void (async () => {
          const response = await apiFetch("/api/reset", { method: "POST" });
          if (!response.ok) return;
          const snapshot = (await response.json().catch(() => null)) as Snapshot | null;
          if (snapshot) {
            mergeSnapshot(set, snapshot);
            return;
          }
          await get().syncFromServer();
        })(),
    }),
    { name: "inv-store-v1" }
  )
);
