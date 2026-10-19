import { useEffect, useRef } from "react";

import { scrollIntoContainer } from "@/lib/dom";
import { cn } from "@/lib/utils";

interface TokenButtonProps {
  /** Segment index: links this token to its highlight in the editor. */
  index: number;
  label: string;
  /** Set for a token in its default state; a kept token has no category colour. */
  category?: string;
  kept?: boolean;
  title: string;
  active: boolean;
  onToggle: () => void;
  onHoverIndex: (index: number | null) => void;
}

/** One redaction (or restored value): click flips it between its two states. */
export function TokenButton({ index, label, category, kept = false, title, active, onToggle, onHoverIndex }: TokenButtonProps) {
  return (
    <button
      type="button"
      data-seg={index}
      className={cn("token", kept ? "token--kept" : `cat--${category}`, active && "token--active")}
      aria-pressed={!kept}
      title={title}
      onClick={onToggle}
      onMouseEnter={() => onHoverIndex(index)}
      onMouseLeave={() => onHoverIndex(null)}
    >
      {label}
    </button>
  );
}

/** A [TOKEN] in a reply that the session's map doesn't know. It can't be toggled, only linked. */
export function UnknownToken({ index, text, active, onHoverIndex }: { index: number; text: string; active: boolean; onHoverIndex: (index: number | null) => void }) {
  return (
    <mark
      data-seg={index}
      className={cn("token-unknown", active && "token--active")}
      title="Not in this session's placeholder map"
      onMouseEnter={() => onHoverIndex(index)}
      onMouseLeave={() => onHoverIndex(null)}
    >
      {text}
    </mark>
  );
}

interface OutputViewProps {
  id: string;
  /** Distinct from the panel's own name, so a screen reader's landmark list doesn't repeat itself. */
  label: string;
  /** Scroll this segment into view (used when the editor highlight is hovered). */
  scrollTo?: number | null;
  children: React.ReactNode;
}

export function OutputView({ id, label, scrollTo = null, children }: OutputViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollTo == null || !ref.current) return;
    const node = ref.current.querySelector<HTMLElement>(`[data-seg="${scrollTo}"]`);
    if (node) scrollIntoContainer(ref.current, node);
  }, [scrollTo]);

  return (
    <div ref={ref} id={id} className="output-view" role="region" tabIndex={0} aria-label={label}>
      {children}
    </div>
  );
}
