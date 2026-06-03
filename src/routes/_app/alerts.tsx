import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, type Alert as AlertType } from "../../lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { AlertTriangle, PackageX, TrendingUp, CheckCheck, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_app/alerts")({
  component: Alerts,
  head: () => ({ meta: [{ title: "Alerts — Smart Inventory" }] }),
});

const meta = {
  low_stock: { icon: PackageX, color: "text-destructive", bg: "bg-destructive/10", label: "Low stock" },
  reorder: { icon: AlertTriangle, color: "text-warning-foreground", bg: "bg-warning/20", label: "Reorder" },
  overstock: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", label: "Overstock" },
} as const;

type Filter = "all" | AlertType["type"];

function Alerts() {
  const alerts = useStore((s) => s.alerts);
  const markRead = useStore((s) => s.markAlertsRead);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const t = setTimeout(() => markRead(), 800);
    return () => clearTimeout(t);
  }, [markRead]);

  useEffect(() => {
    setPage(1);
  }, [filter, search, alerts.length]);

  const counts = useMemo(() => ({
    all: alerts.length,
    low_stock: alerts.filter((a) => a.type === "low_stock").length,
    reorder: alerts.filter((a) => a.type === "reorder").length,
    overstock: alerts.filter((a) => a.type === "overstock").length,
  }), [alerts]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const items = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);
    if (!normalizedSearch) return items;
    return items.filter((a) =>
      [a.productName, a.message, a.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [alerts, filter, normalizedSearch]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "low_stock", label: "Low", count: counts.low_stock },
    { id: "reorder", label: "Reorder", count: counts.reorder },
    { id: "overstock", label: "Overstock", count: counts.overstock },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] items-center">
        <div>
          <p className="text-sm text-muted-foreground">{filtered.length} of {alerts.length} alerts</p>
          <p className="mt-1 text-xs text-muted-foreground">Search alerts by product, message, or status.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product or alert text"
                className="pl-10"
              />
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={() => markRead()} className="gap-1.5">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left"><p>Mark every alert in this view as read.</p></TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none rounded-xl border border-border bg-card p-1.5">
        {tabs.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilter(t.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {t.label}
                <span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] tabular-nums ${
                  filter === t.id ? "bg-primary-foreground/20" : "bg-secondary"
                }`}>{t.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Show {t.label.toLowerCase()} alerts.</p></TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="space-y-3">
        {pageItems.map((a) => {
          const m = meta[a.type];
          const Icon = m.icon;
          return (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${m.bg} ${m.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{a.productName}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-10 text-center">
            <CheckCheck className="mx-auto mb-3 h-8 w-8 text-success" />
            <p className="text-sm font-medium">All clear</p>
            <p className="mt-1 text-xs text-muted-foreground">No alerts in this filter</p>
          </Card>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(pageItems.length === 0 ? 0 : (page - 1) * pageSize + 1)}-{(page - 1) * pageSize + pageItems.length} of {filtered.length}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} />
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      onClick={() => setPage(index + 1)}
                      isActive={page === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setPage(Math.min(pageCount, page + 1))} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
