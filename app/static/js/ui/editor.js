// Source textarea with a highlight backdrop: a mirrored div behind a transparent textarea.
import { escapeHtml } from "./dom.js";

export function createEditor(textarea, backdrop, { onHover } = {}) {
  const syncScroll = () => {
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  };
  textarea.addEventListener("scroll", syncScroll, { passive: true });

  // The backdrop ignores pointer events, so hovering a highlight means hit-testing its rects.
  let hovered = null;
  let pointer = null;
  let frame = 0;

  const setHovered = (index) => {
    if (index === hovered) return;
    hovered = index;
    if (onHover) onHover(index);
  };

  const hitTest = () => {
    frame = 0;
    if (!pointer) return setHovered(null);
    const { x, y } = pointer;
    for (const mark of backdrop.querySelectorAll("mark[data-seg]")) {
      for (const rect of mark.getClientRects()) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return setHovered(Number(mark.dataset.seg));
        }
      }
    }
    setHovered(null);
  };

  const scheduleHitTest = () => {
    if (!frame) frame = requestAnimationFrame(hitTest);
  };

  textarea.addEventListener("mousemove", (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    scheduleHitTest();
  });
  textarea.addEventListener("mouseleave", () => {
    pointer = null;
    scheduleHitTest();
  });
  textarea.addEventListener("scroll", () => pointer && scheduleHitTest(), { passive: true });

  return {
    /** Paint highlights for `segments`; pass null to show plain text (e.g. while live mode is paused). */
    render(segments, rawText) {
      let html;
      if (!segments) {
        html = escapeHtml(rawText || "");
      } else {
        html = segments
          .map((seg, i) => {
            if (seg.type === "text") return escapeHtml(seg.text);
            const cls = seg.excluded ? "hl hl--kept" : `hl hl--${seg.category}`;
            return `<mark class="${cls}" data-seg="${i}">${escapeHtml(seg.text)}</mark>`;
          })
          .join("");
      }
      // Trailing newline keeps the backdrop height in step with the textarea's last line.
      backdrop.innerHTML = `${html}\n`;
      syncScroll();
      hovered = null;
      if (pointer) scheduleHitTest();
    },

    /** Emphasise the highlight for segment `index`, or clear it with null. */
    setActive(index) {
      backdrop.querySelector("mark.hl--active")?.classList.remove("hl--active");
      if (index == null) return;
      backdrop.querySelector(`mark[data-seg="${index}"]`)?.classList.add("hl--active");
    },

    getSelection() {
      const { selectionStart: start, selectionEnd: end, value } = textarea;
      return start === end ? "" : value.slice(start, end);
    }
  };
}
