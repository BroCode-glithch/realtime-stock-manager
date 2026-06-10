import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Store, ShoppingBag, Globe, Smartphone, Plus, Check } from "lucide-react";
import { can, useStore, type SalesChannel } from "../../lib/inventory-store";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — Smart Inventory" }] }),
});

const ICONS = {
  retail: Store,
  online: Globe,
  marketplace: ShoppingBag,
  mobile: Smartphone,
};

const DEFAULT_ALERT_SETTINGS = {
  lowStockRatio: 1,
  reorderRatio: 0.5,
  overstockRatio: 2,
  enableLowStock: true,
  enableReorder: true,
  enableOverstock: true,
};

function Settings() {
  const role = useStore((s) => s.user?.role ?? "staff");
  const canManage = can(role, "manage_channels");
  const channels = useStore((s) => s.channels);
  const alertSettings = useStore((s) => s.alertSettings);
  const loadChannels = useStore((s) => s.loadChannels);
  const loadAlertSettings = useStore((s) => s.loadAlertSettings);
  const loadSettingsAudit = useStore((s) => s.loadSettingsAudit);
  const saveAlertSettings = useStore((s) => s.saveAlertSettings);
  const settingsAudit = useStore((s) => s.settingsAudit);
  const createChannel = useStore((s) => s.createChannel);
  const updateChannel = useStore((s) => s.updateChannel);
  const deleteChannel = useStore((s) => s.deleteChannel);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<SalesChannel["type"]>("online");
  const [lowStockRatio, setLowStockRatio] = useState(String(alertSettings.lowStockRatio));
  const [reorderRatio, setReorderRatio] = useState(String(alertSettings.reorderRatio));
  const [overstockRatio, setOverstockRatio] = useState(String(alertSettings.overstockRatio));
  const [enableLowStock, setEnableLowStock] = useState(alertSettings.enableLowStock);
  const [enableReorder, setEnableReorder] = useState(alertSettings.enableReorder);
  const [enableOverstock, setEnableOverstock] = useState(alertSettings.enableOverstock);

  useEffect(() => {
    void loadChannels();
    void loadAlertSettings();
    void loadSettingsAudit(10, 0);
  }, [loadChannels, loadAlertSettings, loadSettingsAudit]);

  useEffect(() => {
    setLowStockRatio(String(alertSettings.lowStockRatio));
    setReorderRatio(String(alertSettings.reorderRatio));
    setOverstockRatio(String(alertSettings.overstockRatio));
    setEnableLowStock(alertSettings.enableLowStock);
    setEnableReorder(alertSettings.enableReorder);
    setEnableOverstock(alertSettings.enableOverstock);
  }, [alertSettings]);

  const toggle = (channel: SalesChannel) =>
    void updateChannel(channel.id, { enabled: !channel.enabled });

  const add = () => {
    if (!newName.trim()) return;
    void createChannel({ name: newName.trim(), type: newType, enabled: true, notes: "Created from frontend" });
    setNewName("");
  };

  const onSaveAlertSettings = () => {
    void saveAlertSettings({
      lowStockRatio: Number(lowStockRatio),
      reorderRatio: Number(reorderRatio),
      overstockRatio: Number(overstockRatio),
      enableLowStock,
      enableReorder,
      enableOverstock,
    });
  };

  const onResetAlertSettings = () => {
    setLowStockRatio(String(DEFAULT_ALERT_SETTINGS.lowStockRatio));
    setReorderRatio(String(DEFAULT_ALERT_SETTINGS.reorderRatio));
    setOverstockRatio(String(DEFAULT_ALERT_SETTINGS.overstockRatio));
    setEnableLowStock(DEFAULT_ALERT_SETTINGS.enableLowStock);
    setEnableReorder(DEFAULT_ALERT_SETTINGS.enableReorder);
    setEnableOverstock(DEFAULT_ALERT_SETTINGS.enableOverstock);
    void saveAlertSettings(DEFAULT_ALERT_SETTINGS);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Alert and Threshold Rules</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure how sensitive the low-stock and overstock engine should be. Only admins and managers can edit these values.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Low stock ratio</Label>
            <Input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={lowStockRatio}
              onChange={(e) => setLowStockRatio(e.target.value)}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">Threshold: quantity {'<='} reorderLevel * lowStockRatio.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reorder ratio</Label>
            <Input
              type="number"
              min={0}
              max={1.5}
              step={0.1}
              value={reorderRatio}
              onChange={(e) => setReorderRatio(e.target.value)}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">Threshold: quantity {'<='} reorderLevel * reorderRatio (capped to lowStockRatio).</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Overstock ratio</Label>
            <Input
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={overstockRatio}
              onChange={(e) => setOverstockRatio(e.target.value)}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">Threshold: quantity {'>='} reorderLevel * overstockRatio.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label className="text-xs">Enable low stock alerts</Label>
            <Switch checked={enableLowStock} onCheckedChange={setEnableLowStock} disabled={!canManage} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label className="text-xs">Enable reorder alerts</Label>
            <Switch checked={enableReorder} onCheckedChange={setEnableReorder} disabled={!canManage} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label className="text-xs">Enable overstock alerts</Label>
            <Switch checked={enableOverstock} onCheckedChange={setEnableOverstock} disabled={!canManage} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Active profile: low={alertSettings.lowStockRatio}, reorder={alertSettings.reorderRatio}, overstock={alertSettings.overstockRatio}
            {" "}(low/reorder/overstock toggles: {String(alertSettings.enableLowStock)}/{String(alertSettings.enableReorder)}/{String(alertSettings.enableOverstock)}).
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onResetAlertSettings} disabled={!canManage}>Reset defaults</Button>
            <Button onClick={onSaveAlertSettings} disabled={!canManage}>Save alert settings</Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-secondary/25 p-4">
          <h3 className="text-sm font-semibold">What each setting does</h3>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <p>
              <strong>Low stock ratio:</strong> this controls when low-stock alerts trigger. If a product has reorder level 100 and low stock ratio is 1,
              low-stock can trigger at 100 units and below.
            </p>
            <p>
              <strong>Reorder ratio:</strong> this controls reorder alerts and is clamped by backend so it cannot exceed low stock ratio.
              This keeps reorder logic consistent with low-stock boundaries.
            </p>
            <p>
              <strong>Overstock ratio:</strong> this controls when overstock alerts trigger. Lower values trigger overstock alerts earlier;
              higher values make them less frequent.
            </p>
            <p>
              <strong>Enable toggles:</strong> each alert class can be enabled or disabled independently. Disabling a class prevents
              backend from issuing that alert type.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-secondary/25 p-4">
          <h3 className="text-sm font-semibold">Recent settings changes</h3>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            {settingsAudit.length === 0 && <p>No audit entries yet.</p>}
            {settingsAudit.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-md border border-border bg-background px-3 py-2">
                <p className="font-medium text-foreground">{entry.changedBy} changed settings</p>
                <p className="mt-0.5">{new Date(entry.changedAt).toLocaleString()}</p>
                <p className="mt-1">
                  low/reorder/overstock: {entry.previous.lowStockRatio}/{entry.previous.reorderRatio}/{entry.previous.overstockRatio}
                  {" → "}
                  {entry.next.lowStockRatio}/{entry.next.reorderRatio}/{entry.next.overstockRatio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Sales Channels</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect every place you sell so the system can balance supply &amp; demand across them.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {channels.map((c) => {
            const Icon = ICONS[c.type];
            return (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.enabled ? (
                    <Badge className="bg-success/10 text-success hover:bg-success/15 gap-1">
                      <Check className="h-3 w-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => toggle(c)} disabled={!canManage}>
                        {c.enabled ? "Disable" : "Enable"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top"><p>{c.enabled ? "Pause sales from this channel." : "Re-enable this channel."}</p></TooltipContent>
                  </Tooltip>
                  <ConfirmActionDialog
                    title="Delete channel"
                    description={`Delete ${c.name}? Existing transactions keep their history, but the channel will be removed from the active list.`}
                    confirmLabel="Delete"
                    tooltipContent={<p>Delete channel</p>}
                    tooltipSide="top"
                    onConfirm={() => void deleteChannel(c.id)}
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]"
                        disabled={!canManage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs">Add a new channel</Label>
            <Input
              placeholder="e.g. Abuja Pop-up Store"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Channel type</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={newType}
              onChange={(e) => setNewType(e.target.value as SalesChannel["type"])}
            >
              <option value="retail">Retail</option>
              <option value="online">Online</option>
              <option value="marketplace">Marketplace</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
          <div className="flex items-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={add} className="gap-1.5" disabled={!canManage}><Plus className="h-4 w-4" /> Add channel</Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Add a new sales channel.</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Sales Channels — Detailed Guide</h2>
        <p className="text-sm text-muted-foreground mt-1">
          A sales channel is any path your inventory leaves your warehouse through. Wiring them up
          correctly lets the adaptive engine forecast demand and balance reorders.
        </p>

        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="g1">
            <AccordionTrigger>1. What counts as a sales channel?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>Any independent point of sale: a retail shop, your website, a third-party marketplace
              (Jumia, Konga), social storefronts (Instagram, WhatsApp Catalog), or B2B wholesale routes.</p>
              <p>Each channel is treated as a separate demand source. The system compares them and
              shifts stock recommendations toward the channels growing fastest.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="g2">
            <AccordionTrigger>2. Why add multiple channels?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>Avoid stockouts</strong> — the demand model aggregates sales across channels,
              so a viral product on TikTok won't blindside your retail manager.</p>
              <p>• <strong>Cut excess stock</strong> — channels with slow turnover are flagged so you can
              redistribute units instead of reordering.</p>
              <p>• <strong>Accurate Daily Sales Reports</strong> — sales are tagged by channel and rolled
              into the trend chart and revenue totals.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="g3">
            <AccordionTrigger>3. How sales are routed</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>When you record a sale in <strong>Stock Out (Sold)</strong>, choose the channel it came
              from. The transaction deducts from a single shared inventory pool but is attributed to
              that channel in reports.</p>
              <p>For online channels, you can later connect webhooks (POS, Shopify, Jumia) so sales
              flow in automatically without manual entry.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="g4">
            <AccordionTrigger>4. Role permissions per channel</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>Admin</strong> — create, rename, disable channels and edit reorder rules.</p>
              <p>• <strong>Manager</strong> — enable/disable and approve reorder suggestions per channel.</p>
              <p>• <strong>Staff</strong> — record stock-in and stock-out (sales) against any active channel.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="g5">
            <AccordionTrigger>5. Adaptive vs static — what changes</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>Static reorder thresholds treat all channels the same. The adaptive engine watches
              each channel's 7-day moving demand and raises the effective reorder point for the
              channels growing fastest, while letting slow channels drift down.</p>
              <p>Open <strong>Reports</strong> to compare both side-by-side (stock-out rate and excess
              stock).</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="g6">
            <AccordionTrigger>6. Quick setup checklist</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-1">
              <p>☐ Add one channel per real-world point of sale.</p>
              <p>☐ Disable any channel you're not actively selling on.</p>
              <p>☐ Import your products via <strong>Import</strong> so opening stock is correct.</p>
              <p>☐ Record a few sales in <strong>Stock Out</strong> so the demand model has data.</p>
              <p>☐ Review <strong>Alerts</strong> and adjust reorder levels in <strong>Inventory</strong>.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
