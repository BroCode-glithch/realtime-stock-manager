import { apiJson, getRealtimeUrl } from "@/lib/inventory-api";
import { useStore } from "./inventory-store";

type RealtimeMessage =
  | { event: "snapshot"; payload: unknown }
  | { event: "tick"; payload: unknown }
  | { event: "transaction"; payload: unknown }
  | { event: "product:update"; payload: unknown }
  | { event: "alert"; payload: unknown }
  | { event: "ping" }
  | { event: "pong" };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function applySnapshot(payload: unknown) {
  if (!isObject(payload)) return;
  const state = useStore.getState();
  state.syncFromServer();
  if (Array.isArray(payload.products) && Array.isArray(payload.transactions) && Array.isArray(payload.alerts) && Array.isArray(payload.demand) && isObject(payload.staticBaseline)) {
    useStore.setState({
      products: payload.products as never,
      transactions: payload.transactions as never,
      alerts: payload.alerts as never,
      demand: payload.demand as never,
      staticBaseline: payload.staticBaseline as never,
    });
  }
}

function applyRealtimeMessage(message: RealtimeMessage) {
  switch (message.event) {
    case "snapshot":
      applySnapshot(message.payload);
      break;
    case "transaction":
    case "product:update":
    case "alert":
    case "tick":
      void useStore.getState().syncFromServer();
      break;
    default:
      break;
  }
}

export function startInventoryRealtime() {
  if (typeof window === "undefined") return () => {};

  let stopped = false;
  let socket: WebSocket | null = null;
  let retryTimer: number | null = null;

  const connect = () => {
    if (stopped) return;

    socket = new WebSocket(getRealtimeUrl());
    socket.onopen = () => {
      socket?.send(JSON.stringify({ event: "subscribe", payload: { channels: ["products", "alerts", "transactions"] } }));
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as RealtimeMessage;
        applyRealtimeMessage(message);
      } catch {
        void useStore.getState().syncFromServer();
      }
    };
    socket.onclose = () => {
      if (stopped) return;
      retryTimer = window.setTimeout(connect, 3000);
    };
    socket.onerror = () => {
      socket?.close();
    };
  };

  void apiJson<unknown>("/api/state").then((snapshot) => {
    if (snapshot && isObject(snapshot)) {
      useStore.setState({
        products: Array.isArray(snapshot.products) ? (snapshot.products as never) : useStore.getState().products,
        transactions: Array.isArray(snapshot.transactions) ? (snapshot.transactions as never) : useStore.getState().transactions,
        alerts: Array.isArray(snapshot.alerts) ? (snapshot.alerts as never) : useStore.getState().alerts,
        demand: Array.isArray(snapshot.demand) ? (snapshot.demand as never) : useStore.getState().demand,
        staticBaseline: isObject(snapshot.staticBaseline)
          ? (snapshot.staticBaseline as never)
          : useStore.getState().staticBaseline,
      });
    }
  });

  connect();

  return () => {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    socket?.close();
  };
}
