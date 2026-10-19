// Rendered safe-prompt / restored-reply views built from engine segments.
import { escapeHtml, preview } from "./dom.js";

export function renderRedacted(container, result, emptyText) {
  if (!result || !result.segments.length) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
    return;
  }
  container.innerHTML = result.segments
    .map((seg, i) => {
      if (seg.type === "text") return escapeHtml(seg.text);
      const key = escapeHtml(seg.key);
      if (seg.excluded) {
        return `<button type="button" class="token token--kept" data-key="${key}" data-seg="${i}" aria-pressed="false" title="Kept as-is. Click to redact as ${escapeHtml(seg.token)}">${escapeHtml(seg.text)}</button>`;
      }
      return `<button type="button" class="token token--${seg.category}" data-key="${key}" data-seg="${i}" aria-pressed="true" title="${escapeHtml(preview(seg.text, 120))}. Click to keep the original">${escapeHtml(seg.token)}</button>`;
    })
    .join("");
}

/** Restored reply: each restored value is a button that flips it back to its `[TOKEN]` placeholder. */
export function renderRestored(container, restored, emptyText) {
  if (!restored || !restored.segments.length) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
    return;
  }
  container.innerHTML = restored.segments
    .map((seg, i) => {
      if (seg.type === "text") return escapeHtml(seg.text);
      if (seg.type === "unknown") {
        return `<mark class="token-unknown" data-seg="${i}" title="Not in this session's placeholder map">${escapeHtml(seg.text)}</mark>`;
      }
      const key = escapeHtml(seg.token);
      if (seg.held) {
        return `<button type="button" class="token token--kept" data-key="${key}" data-seg="${i}" aria-pressed="false" title="Kept redacted. Click to restore the original">${escapeHtml(seg.token)}</button>`;
      }
      return `<button type="button" class="token token--${seg.category}" data-key="${key}" data-seg="${i}" aria-pressed="true" title="${escapeHtml(seg.token)}. Click to keep it redacted">${escapeHtml(seg.text)}</button>`;
    })
    .join("");
}

/**
 * Segments for the reply editor's highlight backdrop. The backdrop mirrors the textarea, so it
 * shows the pasted `[TOKEN]` text rather than the restored value; indices match `renderRestored`.
 */
export function replyHighlights(restored) {
  if (!restored) return null;
  return restored.segments.map((seg) => {
    if (seg.type === "text") return seg;
    if (seg.type === "unknown") return { type: "span", text: seg.text, category: "unknown", excluded: false };
    return { type: "span", text: seg.token, category: seg.category, excluded: seg.held };
  });
}

/** Delegate clicks on token buttons to `onToggle(key, button)`. */
export function onTokenToggle(container, onToggle) {
  container.addEventListener("click", (event) => {
    const button = event.target.closest("button.token[data-key]");
    if (button && container.contains(button)) onToggle(button.dataset.key, button);
  });
}

/** Report the hovered token's segment index (or null) to `onHover`. */
export function onTokenHover(container, onHover) {
  const indexOf = (node) => {
    const button = node instanceof Element ? node.closest("button.token[data-seg]") : null;
    return button && container.contains(button) ? Number(button.dataset.seg) : null;
  };
  container.addEventListener("mouseover", (event) => onHover(indexOf(event.target)));
  container.addEventListener("mouseleave", () => onHover(null));
}

/** Emphasise the token for segment `index` (null clears); returns the element, if any. */
export function setActiveToken(container, index) {
  container.querySelector(".token--active")?.classList.remove("token--active");
  if (index == null) return null;
  const node = container.querySelector(`[data-seg="${index}"]`);
  node?.classList.add("token--active");
  return node;
}
