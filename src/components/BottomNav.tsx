import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, BellRing, BarChart3, MoreHorizontal,
} from "lucide-react";
import { useStore } from "../lib/inventory-store";
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import { visibleNavItems } from "@/components/AppShell";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

const primary = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Products", icon: Package },
  { to: "/alerts", label: "Alerts", icon: BellRing },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useStore((s) => s.user?.role);
  const unread = useStore((s) => s.alerts.filter((a) => !a.read).length);
  const [moreOpen, setMoreOpen] = useState(false);
  const items = visibleNavItems(role);
  const logout = useStore((s) => s.logout);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {primary.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`group relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] ${
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
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader><SheetTitle>All sections</SheetTitle></SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {items.map(({ to, label, icon: Icon }) => (
                  <SheetClose asChild key={to}>
                    <Link
                      to={to}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-xs font-medium hover:bg-secondary"
                      onClick={() => setMoreOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <ConfirmActionDialog
                  title="Sign out"
                  description="Sign out of this device and return to the login screen?"
                  confirmLabel="Sign out"
                  onConfirm={async () => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                  trigger={
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                      style={{ cursor: "pointer" }}
                      onClick={() => setMoreOpen(false)}
                    >
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                      Logout
                    </button>
                  }
                />
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
