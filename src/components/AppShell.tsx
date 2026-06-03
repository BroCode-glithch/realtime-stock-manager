import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, BellRing, BarChart3, User, Upload, Boxes,
  ArrowDownToLine, ArrowUpFromLine, Receipt, Settings as SettingsIcon, LogOut,
  Search, SunMedium, MoonStar,
  FileText,
} from "lucide-react";
import { can, useStore, type Capability, type Role } from "../lib/inventory-store";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, capability: "view_dashboard" },
  { to: "/inventory", label: "Products", icon: Package, capability: "view_inventory" },
  { to: "/stock-in", label: "Stock In", icon: ArrowDownToLine, capability: "stock_in" },
  { to: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine, capability: "stock_out" },
  { to: "/sales", label: "Sales", icon: Receipt, capability: "view_sales" },
  { to: "/alerts", label: "Alerts", icon: BellRing, capability: "view_alerts" },
  { to: "/system-documentation", label: "System Docs", icon: FileText, capability: "view_system_docs" },
  { to: "/reports", label: "Reports", icon: BarChart3, capability: "view_reports" },
  { to: "/guide", label: "Guide", icon: Boxes, capability: "view_guide" },
  { to: "/import", label: "Import", icon: Upload, capability: "import_products" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, capability: "manage_channels" },
  { to: "/profile", label: "Profile", icon: User, capability: "view_profile" },
] as const;

export function visibleNavItems(role: Role | undefined | null) {
  return navItems.filter((item) => can(role ?? "staff", item.capability as Capability));
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useStore((s) => s.user?.role);
  const unread = useStore((s) => s.alerts.filter((a) => !a.read).length);
  const logout = useStore((s) => s.logout);
  const items = visibleNavItems(role);

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 shrink-0 flex-col bg-card shadow-[1px_0_0_var(--border)] md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Smart Inventory</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Adaptive control</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <Link
                  to={to}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{label}</span>
                  {to === "/alerts" && unread > 0 && (
                    <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold ${
                      active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground"
                    }`}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <div className="max-w-48">
                  <p className="font-medium">{label}</p>
                  <p className="text-[11px] text-muted-foreground">Open the {label.toLowerCase()} workspace.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className="p-3 pt-2 space-y-2">
        <ConfirmActionDialog
          title="Sign out"
          description="Sign out of this device and return to the login screen?"
          confirmLabel="Sign out"
          tooltipContent={<p>Sign out of this device.</p>}
          tooltipSide="right"
          onConfirm={async () => {
            logout();
            navigate({ to: "/login" });
          }}
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] hover:bg-destructive/10"
              style={{ cursor: "pointer" }}
            >
              <LogOut className="h-4 w-4" />
              <span className="flex-1 text-left">Logout</span>
            </button>
          }
        />
      </div>
    </aside>
  );
}

export function HeaderBar({ title }: { title: string }) {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const profileName = user?.name ?? "User";
  const initials = profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const runSearch = () => {
    const value = query.trim();
    if (!value) return;
    navigate({ to: "/inventory", search: { q: value } as never });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 bg-card/90 shadow-[0_1px_0_var(--border)] backdrop-blur md:left-60">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Realtime system</p>
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
        </div>

        <div className="hidden min-w-[14rem] max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 shadow-sm md:flex">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            placeholder="Search products, reports, alerts..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              <p>Switch between light and dark mode.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-3 rounded-full border border-border bg-background px-2 py-1.5">
                <Avatar className="h-9 w-9">
                  <AvatarImage alt={profileName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 pr-1">
                  <p className="truncate text-sm font-medium leading-none">{profileName}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{user?.role ?? "staff"}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              <div className="max-w-48">
                <p className="font-medium">{profileName}</p>
                <p className="text-[11px] text-muted-foreground">Open the profile page for account actions and activity.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
