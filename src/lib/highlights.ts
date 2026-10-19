import type { HighlightSegment } from "@/components/HighlightEditor";
import type { RestoreResult } from "@/engine/redact.js";

/**
 * Segments for the reply editor's highlight layer. That layer mirrors the textarea, so it shows the pasted
 * `[TOKEN]` text rather than the restored value; indices match the segments rendered in the restored pane.
 */
export function restoreHighlights(restored: RestoreResult | null): HighlightSegment[] | null {
  if (!restored) return null;
  return restored.segments.map((seg): HighlightSegment => {
    if (seg.type === "text") return seg;
    if (seg.type === "unknown") return { type: "span", text: seg.text, category: "unknown", excluded: false };
    return { type: "span", text: seg.token, category: seg.category, excluded: seg.held };
  });
}
