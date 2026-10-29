import { Button } from "@/components/ui/button";
import { dismissToast, useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** One toast at a time, announced politely. The offset keeps it clear of the panel footers. */
export function Toaster() {
  const current = useToast();
  return (
    <div
      id="toast-region"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-[88px] left-1/2 z-(--z-toast) -translate-x-1/2"
    >
      {current ? (
        <div
          key={current.id}
          data-tone={current.tone}
          className={cn(
            "max-w-[min(520px,calc(100vw-2rem))] rounded-lg [overflow-wrap:anywhere] border border-border-strong bg-popover px-4 py-2.5 text-sm shadow-panel",
            "animate-in fade-in-0 slide-in-from-bottom-2 duration-(--dur-slow)",
            current.tone === "success" && "border-success/50",
            current.tone === "error" && "border-destructive/60 text-destructive",
            current.action && "pointer-events-auto flex items-center gap-3 py-1.5 pr-1.5"
          )}
        >
          {current.action ? <span className="min-w-0">{current.message}</span> : current.message}
          {current.action ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                current.action?.onClick();
                dismissToast();
              }}
            >
              {current.action.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
