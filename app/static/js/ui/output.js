// Rendered safe-prompt / restored-reply views built from engine segments.
import { escapeHtml, preview } from "./dom.js";

export function renderRedacted(container, result, emptyText) {
  if (!result || !result.segments.length) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
    return;
  }
  container.innerHTML = result.segments
    .map((seg) => {
      if (seg.type === "text") return escapeHtml(seg.text);
      const key = escapeHtml(seg.key);
      if (seg.excluded) {
        return `<button type="button" class="token token--kept" data-key="${key}" aria-pressed="false" title="Kept as-is. Click to redact as ${escapeHtml(seg.token)}">${escapeHtml(seg.text)}</button>`;
      }
      return `<button type="button" class="token token--${seg.category}" data-key="${key}" aria-pressed="true" title="${escapeHtml(preview(seg.text, 120))}. Click to keep the original">${escapeHtml(seg.token)}</button>`;
    })
    .join("");
}

export function renderRestored(container, restored, emptyText) {
  if (!restored || !restored.segments.length) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
    return;
  }
  container.innerHTML = restored.segments
    .map((seg) => {
      if (seg.type === "text") return escapeHtml(seg.text);
      if (seg.type === "unknown") {
        return `<mark class="restored restored--unknown" title="Not in this session's placeholder map">${escapeHtml(seg.text)}</mark>`;
      }
      return `<mark class="restored" title="${escapeHtml(seg.token)}">${escapeHtml(seg.text)}</mark>`;
    })
    .join("");
}

/** Delegate clicks on token buttons to `onToggle(key)`. */
export function onTokenToggle(container, onToggle) {
  container.addEventListener("click", (event) => {
    const button = event.target.closest("button.token[data-key]");
    if (button && container.contains(button)) onToggle(button.dataset.key);
  });
}
