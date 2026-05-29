import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type SystemPreloaderProps = {
  visible: boolean;
};

const SYSTEM_PRELOADER = "https://lottie.host/5f5291d9-60cf-494b-9ef5-550c73ec0530/t5wpoltV9E.lottie";

export function SystemPreloader({ visible }: SystemPreloaderProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl border border-border bg-card/80 px-6 py-8 shadow-2xl shadow-primary/10">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-8 animate-pulse rounded-full bg-primary/15" />
          <div className="absolute inset-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <div className="relative w-full">
            <DotLottieReact src={SYSTEM_PRELOADER} loop autoplay />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight">Smart Inventory</p>
          <p className="mt-1 text-xs text-muted-foreground">Loading realtime system…</p>
        </div>
      </div>
    </div>
  );
}