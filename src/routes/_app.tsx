import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/inventory-store";

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
  "/inventory": "Inventory",
  "/alerts": "Alerts",
  "/reports": "Reports",
  "/profile": "Profile",
};

function AppLayout() {
  const tick = useStore((s) => s.tickSimulation);
  const location = useLocation();
  const title = Object.entries(titles).find(([k]) => location.pathname.startsWith(k))?.[1] ?? "Inventory";

  useEffect(() => {
    const id = setInterval(() => tick(), 4000);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Smart Inventory
            </p>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">Live</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
