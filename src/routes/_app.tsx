import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HeaderBar, Sidebar } from "@/components/AppShell";
import { useStore } from "../lib/inventory-store";
import { startInventoryRealtime } from "@/lib/inventory-realtime";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiJson, type ApiAiChatResponse, type ApiChatMessage } from "@/lib/inventory-api";
import { Sparkles, MessageSquare } from "lucide-react";

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
  "/ai-insights": "AI Insights",
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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<ApiChatMessage[]>([]);
  const [aiSending, setAiSending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const role = useStore((s) => s.user?.role);
  const canSeeAi = role === "admin" || role === "manager";

  const sendAiMessage = async () => {
    const trimmed = aiQuery.trim();
    if (!trimmed || aiSending) return;

    const nextMessages: ApiChatMessage[] = [...aiMessages, { role: "user", content: trimmed }];
    setAiMessages(nextMessages);
    setAiQuery("");
    setAiSending(true);
    setAiError(null);

    const payload = { messages: nextMessages, includeData: ["products", "alerts"] };
    const result = await apiJson<ApiAiChatResponse>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result) {
      setAiError("Unable to reach the AI assistant. Please try again.");
      setAiSending(false);
      return;
    }

    setAiMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    setAiSending(false);
  };

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
        {canSeeAi && (
          <>
            <div className="fixed right-4 bottom-24 z-50 md:bottom-10">
              <Button
                variant="secondary"
                size="icon"
                className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                onClick={() => setAiOpen(true)}
                aria-label="Open AI assistant"
              >
                <Sparkles className="h-6 w-6" />
              </Button>
            </div>
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>AI Assistant</DialogTitle>
                  <DialogDescription>
                    Ask about stock risk, alerts, recommendations, or inventory trends. The chat runs against the current backend context.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>Conversation</span>
                    </div>
                    <div className="mt-4 max-h-[340px] overflow-y-auto space-y-3">
                      {aiMessages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Start the conversation by asking a question.</p>
                      ) : (
                        aiMessages.map((message, index) => (
                          <div
                            key={`${message.role}-${index}`}
                            className={`rounded-2xl p-3 ${message.role === "user" ? "bg-primary/5 text-foreground" : "bg-secondary/5 text-muted-foreground"}`}
                          >
                            <div className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                              {message.role === "user" ? "You" : "Assistant"}
                            </div>
                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {aiError && <p className="text-sm text-destructive">{aiError}</p>}

                  <div className="space-y-2">
                    <Textarea
                      value={aiQuery}
                      onChange={(event) => setAiQuery(event.target.value)}
                      placeholder="Ask the AI about risk, reorder recommendations, or current stock levels..."
                      rows={4}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button variant="outline" onClick={() => { setAiQuery(""); setAiError(null); }} disabled={aiSending}>
                        Clear draft
                      </Button>
                      <Button onClick={sendAiMessage} disabled={!aiQuery.trim() || aiSending}>
                        {aiSending ? "Sending..." : "Send message"}
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-4 gap-2">
                  <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiSending}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
