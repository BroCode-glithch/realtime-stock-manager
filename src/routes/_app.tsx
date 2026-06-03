import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HeaderBar, Sidebar } from "@/components/AppShell";
import { useStore } from "../lib/inventory-store";
import { startInventoryRealtime } from "@/lib/inventory-realtime";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  "/guide": "System Guide",
  "/import": "Import data",
  "/settings": "Settings",
  "/system-documentation": "System Documentation",
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
    <TooltipProvider delayDuration={180}>
      <div className="min-h-screen bg-background md:pl-60 flex flex-col">
        <Sidebar />
        <div className="flex min-h-screen flex-col pb-24 md:pb-0">
          <HeaderBar title={title} />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 md:px-8 py-5 md:py-7 pt-20 md:pt-24">
            <Outlet />
          </main>
          <footer className="mt-auto px-4 py-8 md:px-8">
            <div className="mx-auto grid max-w-5xl gap-4 rounded-3xl border border-border bg-card/80 px-5 py-5 text-sm text-muted-foreground shadow-sm md:grid-cols-[1.2fr_0.8fr_0.8fr] md:items-start">
              <div>
                <p className="text-base font-semibold text-foreground">Smart Inventory</p>
                <p className="mt-2 leading-6">
                  Keeps retail and warehouse operations synchronized in realtime with role-aware workflows,
                  adaptive demand signals, and live reporting.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">System state</p>
                <p className="mt-2 text-sm">{running ? `${(intervalMs / 1000).toFixed(1)}s sync` : "Sync paused"}</p>
                <p className="mt-1 text-xs">Realtime updates, inventory actions, and reports stay aligned to the backend.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Navigation</p>
                <p className="mt-2 text-sm">Guide, alerts, reports, and stock actions are role-aware.</p>
                <p className="mt-1 text-xs">Use the sidebar for desktop workflows and the bottom bar on mobile.</p>
              </div>
            </div>
          </footer>
        </div>
        <BottomNav />
      </div>
    </TooltipProvider>
  );
}
