import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

const MIN = 25;
const MAX = 75;

interface SplitterProps {
  /** Left pane's share of the container, 25 to 75. */
  value: number;
  onChange: (value: number) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  label: string;
}

const clamp = (n: number) => Math.round(Math.min(MAX, Math.max(MIN, n)));

/** Vertical splitter between two flex panes: drag, arrow keys (Shift = bigger steps), Home/End, double-click to reset. */
export function Splitter({ value, onChange, containerRef, label }: SplitterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const handle = ref.current;
    const container = containerRef.current;
    if (event.button !== 0 || !handle || !container) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing");
    setDragging(true);
    const rect = container.getBoundingClientRect();

    const move = (e: PointerEvent) => onChange(clamp(((e.clientX - rect.left) / rect.width) * 100));
    const stop = () => {
      document.body.classList.remove("is-resizing");
      setDragging(false);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    const next = { ArrowLeft: value - step, ArrowRight: value + step, Home: MIN, End: MAX }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(clamp(next));
  };

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={value}
      className="group relative flex-none basis-3 cursor-col-resize touch-none outline-none"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onChange(50)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 left-1/2 h-11 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border-strong",
          "transition-[height,background-color] duration-(--dur-fast)",
          "group-hover:h-[72px] group-hover:bg-subtle group-focus-visible:h-[72px] group-focus-visible:bg-subtle",
          dragging && "h-[72px] bg-subtle"
        )}
      />
    </div>
  );
}
