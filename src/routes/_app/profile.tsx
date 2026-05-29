import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "../../lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogOut, RefreshCcw, Shield } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile — Smart Inventory" }] }),
});

function Profile() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.resetSeed);
  const transactions = useStore((s) => s.transactions);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{user.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Shield className="h-3 w-3" /> {user.role}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Audit trail</h3>
        <div className="space-y-2">
          {transactions.slice(0, 10).map((t) => (
            <div key={t.id} className="flex items-center justify-between pb-2 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.productName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(t.timestamp).toLocaleString()} • {t.type}
                </p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${t.quantityChanged < 0 ? "text-destructive" : "text-success"}`}>
                {t.quantityChanged > 0 ? "+" : ""}{t.quantityChanged}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        <ConfirmActionDialog
          title="Restore demo data"
          description="Restore the seeded inventory, transactions, alerts, and channels to their default demo state?"
          confirmLabel="Restore"
          destructive={false}
          tooltipContent={<p>Reset the demo data to its seeded state.</p>}
          tooltipSide="right"
          onConfirm={reset}
          trigger={
            <Button
              variant="outline"
              className="w-full justify-start gap-2 transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]"
              style={{ cursor: "pointer" }}
            >
              <RefreshCcw className="h-4 w-4" /> Restore demo data
            </Button>
          }
        />
        <ConfirmActionDialog
          title="Sign out"
          description="Sign out of this device and return to the login screen?"
          confirmLabel="Sign out"
          tooltipContent={<p>Sign out of the current session.</p>}
          tooltipSide="right"
          onConfirm={async () => {
            logout();
            navigate({ to: "/login" });
          }}
          trigger={
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]"
              style={{ cursor: "pointer" }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          }
        />
      </div>
    </div>
  );
}
