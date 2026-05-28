import { useStore } from "@/lib/inventory-store";
import { Button } from "@/components/ui/button";
import { Play, Pause, Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function SimControls({ compact = false }: { compact?: boolean }) {
  const running = useStore((s) => s.simRunning);
  const intervalMs = useStore((s) => s.simIntervalMs);
  const setRunning = useStore((s) => s.setSimRunning);
  const setMs = useStore((s) => s.setSimIntervalMs);

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 ${compact ? "" : "shadow-sm"}`}>
      <Button
        size="sm"
        variant={running ? "secondary" : "default"}
        onClick={() => setRunning(!running)}
        className="gap-1.5"
      >
        {running ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Start</>}
      </Button>
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <Gauge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Slider
          value={[intervalMs]}
          min={500}
          max={10000}
          step={500}
          onValueChange={(v) => setMs(v[0])}
          className="flex-1"
        />
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground w-12 text-right">
          {(intervalMs / 1000).toFixed(1)}s
        </span>
      </div>
    </div>
  );
}
