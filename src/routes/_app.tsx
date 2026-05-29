import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/AppShell";
import { useStore } from "@/lib/inventory-store";
import { startInventoryRealtime } from "@/lib/inventory-realtime";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  beforeLoad: () => {
    if (!useStore.getState().user) {
      throw redirect({ to: "/login" });
    }
  },
});

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Product Listing",
  "/stock-in": "Stock In Log",
  "/stock-out": "Stock Out (Sold)",
  "/sales": "Daily Sales Report",
  "/alerts": "Alerts",
  "/reports": "Reports",
  "/import": "Import data",
  "/settings": "Settings",
  "/profile": "Profile",
};

function AppLayout() {
  const syncFromServer = useStore((s) => s.syncFromServer);
  const running = useStore((s) => s.simRunning);
  const intervalMs = useStore((s) => s.simIntervalMs);
  const location = useLocation();
  const title = Object.entries(titles).find(([k]) => location.pathname.startsWith(k))?.[1] ?? "Inventory";

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  useEffect(() => {
    const stop = startInventoryRealtime();
    return stop;
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => void syncFromServer(), intervalMs);
    return () => clearInterval(id);
  }, [running, intervalMs, syncFromServer]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 md:px-8 py-3.5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {running ? "Live" : "Paused"}
              </p>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {running && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${running ? "bg-success" : "bg-muted-foreground"}`} />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {running ? `${(intervalMs / 1000).toFixed(1)}s tick` : "Simulation paused"}
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 md:px-8 py-5 md:py-7">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
