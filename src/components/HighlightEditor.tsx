// A textarea over a mirrored, transparent-text layer that paints highlights behind the typed text.
import { Fragment, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type HighlightSegment =
  | { type: "text"; text: string }
  | { type: "span"; text: string; category: string; excluded: boolean };

interface HighlightEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Pass null to show plain text (e.g. while the result is stale or live mode is paused). */
  segments: HighlightSegment[] | null;
  placeholder?: string;
  /** Segment index to emphasise. */
  activeIndex?: number | null;
  /** Reports the segment under the pointer (or null). */
  onHoverIndex?: (index: number | null) => void;
  /** Reports the selected text whenever the selection may have changed. */
  onSelectionText?: (text: string) => void;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function HighlightEditor({
  id,
  value,
  onChange,
  segments,
  placeholder,
  activeIndex = null,
  onHoverIndex,
  onSelectionText,
  ref
}: HighlightEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef(0);
  const hovered = useRef<number | null>(null);
  const onHoverRef = useRef(onHoverIndex);
  onHoverRef.current = onHoverIndex;

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const syncScroll = () => {
    const textarea = textareaRef.current;
    const backdrop = backdropRef.current;
    if (!textarea || !backdrop) return;
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  };

  // The backdrop ignores pointer events, so hovering a highlight means hit-testing its rects.
  const hitTest = () => {
    frame.current = 0;
    const backdrop = backdropRef.current;
    let next: number | null = null;
    if (pointer.current && backdrop) {
      const { x, y } = pointer.current;
      outer: for (const mark of backdrop.querySelectorAll<HTMLElement>("mark[data-seg]")) {
        for (const rect of mark.getClientRects()) {
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            next = Number(mark.dataset.seg);
            break outer;
          }
        }
      }
    }
    if (next !== hovered.current) {
      hovered.current = next;
      onHoverRef.current?.(next);
    }
  };

  const scheduleHitTest = () => {
    if (!frame.current) frame.current = requestAnimationFrame(hitTest);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Keep the layers aligned, and re-test the pointer when the highlights under it were replaced.
  useLayoutEffect(() => {
    syncScroll();
    hovered.current = null;
    if (pointer.current) scheduleHitTest();
  }, [segments, value]);

  const emitSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea || !onSelectionText) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    onSelectionText(start === end ? "" : textarea.value.slice(start, end));
  };

  return (
    <div className="editor">
      <div ref={backdropRef} className="editor__backdrop" aria-hidden="true">
        {segments
          ? segments.map((seg, i) =>
              seg.type === "text" ? (
                <Fragment key={i}>{seg.text}</Fragment>
              ) : (
                <mark
                  key={i}
                  data-seg={i}
                  className={cn("hl", seg.excluded ? "hl--kept" : `cat--${seg.category}`, i === activeIndex && "hl--active")}
                >
                  {seg.text}
                </mark>
              )
            )
          : value}
        {/* Trailing newline keeps the backdrop height in step with the textarea's last line. */}
        {"\n"}
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        className="editor__input"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        onChange={(event) => {
          onChange(event.target.value);
          emitSelection();
        }}
        onScroll={() => {
          syncScroll();
          if (pointer.current) scheduleHitTest();
        }}
        onMouseMove={(event) => {
          pointer.current = { x: event.clientX, y: event.clientY };
          scheduleHitTest();
        }}
        onMouseLeave={() => {
          pointer.current = null;
          scheduleHitTest();
        }}
        onSelect={emitSelection}
        onKeyUp={emitSelection}
        onMouseUp={emitSelection}
        onBlur={emitSelection}
      />
    </div>
  );
}
