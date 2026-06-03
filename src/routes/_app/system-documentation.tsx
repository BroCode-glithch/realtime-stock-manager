import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useStore } from "../../lib/inventory-store";
import { Shield, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/system-documentation")({
  component: SystemDocumentation,
  head: () => ({ meta: [{ title: "System Documentation — Smart Inventory" }] }),
});

function SystemDocumentation() {
  const role = useStore((s) => s.user?.role ?? "staff");

  if (!(role === "admin" || role === "manager")) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" /> Access denied
          </div>
          <h2 className="mt-2 text-lg font-semibold">Documentation — restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">This documentation page is visible to administrators and managers only.</p>
          <div className="mt-4">
            <a href="/_app/dashboard" className="text-sm font-medium text-primary">Return to dashboard</a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" /> System documentation
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Application documentation (Admin / Manager)</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This page contains a detailed description of the system, per-screen guidance, decision logic, alert rules, and
            placeholders for screenshots. Add screenshots into the repo under <strong>docs/images/</strong> using the
            placeholder filenames shown for each screen.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">System overview</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The app records inventory transactions and keeps a short-term demand history. It computes an adaptive reorder
            threshold per product and generates alerts for low stock, reorder suggestions, and overstock conditions. All
            changes are persisted via the API and the client syncs a snapshot for an authoritative view.
          </p>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">Key points</p>
            <ul className="ml-4 list-disc text-sm text-muted-foreground">
              <li>Transactions: stock-in, stock-out, adjustments are recorded with user and channel metadata.</li>
              <li>Demand history: recent daily demand points are used for adaptive calculations.</li>
              <li>Adaptive threshold: ensures reorder suggestions follow current demand patterns.</li>
              <li>Alerts: surfaced in the Alerts page and can be marked as read.</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold">Role access</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            This page is restricted to `admin` and `manager` roles. Role capabilities are defined in
            <code className="ml-1">src/lib/inventory-store.ts</code> and control which UI items appear for each user.
          </p>
        </Card>
      </section>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Screens and screenshot placeholders</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add screenshots to <strong>docs/images/</strong> using the filenames below.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Dashboard", "dashboard.jpg", "Overview of trends, stock value, active alerts"],
            ["Inventory (Products list)", "inventory.jpg", "Searchable product master with quantities and reorder level"],
            ["Product detail", "product-detail.jpg", "Edit product metadata, price and reorder level"],
            ["Stock In", "stock-in.jpg", "Receive inventory into a product (supplier, qty, channel)"],
            ["Stock Out", "stock-out.jpg", "Record sales or removals with channel and qty"],
            ["Alerts", "alerts.jpg", "Active alerts list with read / dismiss controls"],
            ["Reports", "reports.jpg", "Daily sales, inventory summary and performance charts"],
            ["Channels / Settings", "settings.jpg", "Manage sales channels and system settings"],
          ].map(([title, file, desc]) => (
            <div key={String(file)} className="rounded-2xl border border-border bg-secondary/20 p-4">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              <div className="mt-3">
                <div className="h-28 w-full rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                  Placeholder: docs/images/{file}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Decision logic & formulas</h2>
        <p className="mt-2 text-sm text-muted-foreground">The core algorithm used by the alert engine is:</p>
        <ul className="ml-4 list-disc text-sm text-muted-foreground mt-3">
          <li>
            Compute average recent daily demand from recent demand points (typically last 7 days):
            <div className="mt-1 font-mono text-xs">avg = sum(last_n_days)/n</div>
          </li>
          <li className="mt-2">
            Adaptive reorder threshold:
            <div className="mt-1 font-mono text-xs">adaptiveThreshold = max(reorderLevel, round(avg * 3))</div>
          </li>
          <li className="mt-2">
            Alert rules:
            <div className="ml-4">
              <div className="text-xs">- If quantity &lt;= adaptiveThreshold → create alert</div>
              <div className="text-xs">  • type = `low_stock` when quantity &lt;= reorderLevel</div>
              <div className="text-xs">  • type = `reorder` when reorderLevel &lt; quantity &lt;= adaptiveThreshold</div>
              <div className="text-xs">- Else if quantity &gt; adaptiveThreshold * 5 and quantity &gt; 50 → `overstock` alert</div>
            </div>
          </li>
        </ul>

        <div className="mt-4 text-sm text-muted-foreground">
          Implementation reference: <code>src/lib/inventory-store.ts</code>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Delivery checklist</h2>
        <ul className="ml-4 list-disc text-sm text-muted-foreground mt-3">
          <li>Add your screenshots to <strong>docs/images/</strong> using the filenames listed above.</li>
          <li>Optionally export the mermaid flowchart from <code>docs/system-documentation.md</code> to <strong>docs/images/flowchart.svg</strong>.</li>
          <li>Review wording and adjust for your audience; admins/managers see this page in the app.</li>
        </ul>
      </Card>
    </div>
  );
}

export default SystemDocumentation;
