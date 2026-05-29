export type ApiSnapshot = {
  products: unknown[];
  transactions: unknown[];
  alerts: unknown[];
  demand: unknown[];
  staticBaseline: { stockouts: number; excess: number };
};

const DEFAULT_API_BASE_URL = "http://localhost:3001";

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
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
  return new URL(path.replace(/^\//, ""), `${getApiBaseUrl().replace(/\/$/, "")}/`).toString();
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
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
