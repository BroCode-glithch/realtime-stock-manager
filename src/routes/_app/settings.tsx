import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Store, ShoppingBag, Globe, Smartphone, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — Smart Inventory" }] }),
});

type Channel = {
  id: string;
  name: string;
  type: "retail" | "online" | "marketplace" | "mobile";
  enabled: boolean;
};

const ICONS = {
  retail: Store,
  online: Globe,
  marketplace: ShoppingBag,
  mobile: Smartphone,
};

function Settings() {
  const [channels, setChannels] = useState<Channel[]>([
    { id: "c1", name: "Lagos Flagship Store", type: "retail", enabled: true },
    { id: "c2", name: "Online Store (Web)", type: "online", enabled: true },
    { id: "c3", name: "Jumia Marketplace", type: "marketplace", enabled: false },
    { id: "c4", name: "WhatsApp Catalog", type: "mobile", enabled: true },
  ]);
  const [newName, setNewName] = useState("");

  const toggle = (id: string) =>
    setChannels((cs) => cs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));

  const add = () => {
    if (!newName.trim()) return;
    setChannels((cs) => [...cs, { id: `c${Date.now()}`, name: newName.trim(), type: "online", enabled: true }]);
    setNewName("");
  };

  return (
    <div className="space-y-5">
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
                  <Button size="sm" variant="outline" onClick={() => toggle(c.id)}>
                    {c.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs">Add a new channel</Label>
            <Input
              placeholder="e.g. Abuja Pop-up Store"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={add} className="gap-1.5"><Plus className="h-4 w-4" /> Add channel</Button>
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
