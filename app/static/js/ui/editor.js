// Source textarea with a highlight backdrop: a mirrored div behind a transparent textarea.
import { escapeHtml } from "./dom.js";

export function createEditor(textarea, backdrop) {
  const syncScroll = () => {
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  };
  textarea.addEventListener("scroll", syncScroll, { passive: true });

  return {
    /** Paint highlights for `segments`; pass null to show plain text (e.g. while live mode is paused). */
    render(segments, rawText) {
      let html;
      if (!segments) {
        html = escapeHtml(rawText || "");
      } else {
        html = segments
          .map((seg) => {
            if (seg.type === "text") return escapeHtml(seg.text);
            const cls = seg.excluded ? "hl hl--kept" : `hl hl--${seg.category}`;
            return `<mark class="${cls}">${escapeHtml(seg.text)}</mark>`;
          })
          .join("");
      }
      // Trailing newline keeps the backdrop height in step with the textarea's last line.
      backdrop.innerHTML = `${html}\n`;
      syncScroll();
    },

    getSelection() {
      const { selectionStart: start, selectionEnd: end, value } = textarea;
      return start === end ? "" : value.slice(start, end);
    }
  };
}
