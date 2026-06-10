import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useStore } from "../../lib/inventory-store";
import { Sparkles, BarChart3, ClipboardList, MessageSquare, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/ai-insights")({
  component: AIInsightsPage,
  head: () => ({ meta: [{ title: "AI Insights — Smart Inventory" }] }),
});

function AIInsightsPage() {
  const role = useStore((s) => s.user?.role ?? "staff");
  const canUseAi = role === "admin" || role === "manager";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          <span>AI Insights</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">AI Insights documentation</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This page documents the frontend contract for the AI Insights suite. Use the floating button in the
          bottom-right corner to open this page from anywhere in the app.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>AI endpoints</Badge>
          <Badge>OpenAPI</Badge>
          <Badge>Role-aware</Badge>
          <Badge>Fallback first</Badge>
        </div>
      </Card>

      {!canUseAi && (
        <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <div className="font-semibold">Access note</div>
          <p className="mt-2 text-muted-foreground">
            AI endpoints are restricted to admin and manager users. The floating button is visible only to those roles.
            Staff users can still read this page, but backend calls to `/api/ai/*` will return 403.
          </p>
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <BarChart3 className="h-4 w-4" />
            <span>Available endpoints</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">POST /api/ai/forecast</span> — demand forecast with EMA-based fallback.
            </li>
            <li>
              <span className="font-semibold text-foreground">POST /api/ai/recommendations</span> — reorder/hold/reduce/promote recommendations.
            </li>
            <li>
              <span className="font-semibold text-foreground">POST /api/ai/recommendations/:id/decision</span> — accept/reject audit recording.
            </li>
            <li>
              <span className="font-semibold text-foreground">GET /api/ai/recommendations/audit</span> — decision history listing.
            </li>
            <li>
              <span className="font-semibold text-foreground">POST /api/ai/alerts/score</span> — risk-ranked smart alert scoring.
            </li>
            <li>
              <span className="font-semibold text-foreground">POST /api/ai/chat</span> — natural language assistant for inventory questions.
            </li>
            <li>
              <span className="font-semibold text-foreground">POST /api/ai/weekly-summary</span> — narrative inventory report in JSON or Markdown.
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ClipboardList className="h-4 w-4" />
            <span>Frontend integration tips</span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              All AI requests require <span className="font-semibold">Authorization: Bearer &lt;jwt&gt;</span> and are
              restricted to admin/manager roles.
            </p>
            <p>
              The API contract is documented in <code className="rounded bg-secondary px-1 py-0.5">openapi.yaml</code> at the project root.
            </p>
            <p>
              Use the floating button to open the AI Insights hub from any page, then consume the AI endpoints in the order:
              Forecast, Recommendations, Alerts, Chat, Weekly Summary.
            </p>
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <MessageSquare className="h-4 w-4" />
          <span>How to use the floating button</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Click the floating button on the bottom right to open the AI Insights page quickly. This provides the main entry point for the AI assistant and the API documentation you need to wire frontend components.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Once the AI Insights page is open, build the frontend UI to call the OpenAPI-defined endpoints and handle <strong>source: "fallback"</strong> vs <strong>source: "ai"</strong> responses consistently.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <FileText className="h-4 w-4" />
          <span>OpenAPI reference</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The OpenAPI spec contains exact request/response schemas for all AI endpoint payloads. Use it as the single source of truth for your frontend HTTP client and type generation.
        </p>
      </Card>
    </div>
  );
}
