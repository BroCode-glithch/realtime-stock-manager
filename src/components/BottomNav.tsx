import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, BellRing, BarChart3, MoreHorizontal,
} from "lucide-react";
import { useStore } from "@/lib/inventory-store";
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { navItems } from "@/components/AppShell";

const primary = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Products", icon: Package },
  { to: "/alerts", label: "Alerts", icon: BellRing },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function BottomNav() {
  const location = useLocation();
  const unread = useStore((s) => s.alerts.filter((a) => !a.read).length);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {primary.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`group relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`absolute -top-px h-0.5 w-8 rounded-full transition-all ${active ? "bg-primary" : "bg-transparent"}`} />
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  {to === "/alerts" && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-full flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader><SheetTitle>All sections</SheetTitle></SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-xs font-medium hover:bg-secondary"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
