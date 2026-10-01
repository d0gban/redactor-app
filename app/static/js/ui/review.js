// Review sidebar: "Always redact" terms, detector toggles and the grouped findings list.
import { CATEGORIES, CUSTOM_CATEGORY } from "../engine/detectors.js";
import { escapeHtml, plural, preview } from "./dom.js";

const ENTITY_OPTIONS = [
  ["PERSON", "Person"],
  ["ORG", "Organization"],
  ["PROJECT", "Project"],
  ["LOCATION", "Location"],
  ["CUSTOM", "Other"]
];

const GROUP_ORDER = [CUSTOM_CATEGORY, ...CATEGORIES];

function entitySelect(term) {
  const options = ENTITY_OPTIONS.some(([value]) => value === term.entity)
    ? ENTITY_OPTIONS
    : [...ENTITY_OPTIONS, [term.entity, term.entity]];
  return `<select class="term__entity" data-term-id="${escapeHtml(term.id)}" aria-label="Type for ${escapeHtml(term.value)}">${options
    .map(([value, label]) => `<option value="${escapeHtml(value)}"${value === term.entity ? " selected" : ""}>${escapeHtml(label)}</option>`)
    .join("")}</select>`;
}

export function renderTerms(list, terms) {
  if (!terms.length) {
    list.innerHTML = `<li class="empty-state empty-state--sm">No terms yet. Add names, companies or projects that pattern detection can't know about.</li>`;
    return;
  }
  list.innerHTML = terms
    .map((term) => {
      const flags = [term.caseSensitive ? "Aa" : "", term.wholeWord ? "" : "partial"].filter(Boolean).join(" · ");
      return `<li class="term">
        ${entitySelect(term)}
        <span class="term__value" title="${escapeHtml(term.value)}">${escapeHtml(preview(term.value, 40))}</span>
        ${flags ? `<span class="term__flags">${escapeHtml(flags)}</span>` : ""}
        <button type="button" class="term__remove" data-term-id="${escapeHtml(term.id)}" aria-label="Remove ${escapeHtml(term.value)}">×</button>
      </li>`;
    })
    .join("");
}

function countByCategory(findings) {
  const counts = new Map();
  for (const f of findings || []) counts.set(f.category, (counts.get(f.category) || 0) + 1);
  return counts;
}

export function renderDetectors(container, enabledCategories, findings) {
  const counts = countByCategory(findings);
  container.innerHTML = CATEGORIES.map((cat) => {
    const on = enabledCategories.has(cat.id);
    return `<label class="detector detector--${cat.id}">
      <input type="checkbox" data-category="${cat.id}"${on ? " checked" : ""}>
      <span class="detector__swatch" aria-hidden="true"></span>
      <span class="detector__text">
        <span class="detector__label">${escapeHtml(cat.label)}</span>
        <span class="detector__hint">${escapeHtml(cat.hint)}</span>
      </span>
      <span class="detector__count">${on ? counts.get(cat.id) || 0 : "off"}</span>
    </label>`;
  }).join("");
}

export function renderFindings(container, findings) {
  if (!findings || !findings.length) {
    container.innerHTML = `<p class="empty-state empty-state--sm">Nothing detected yet.</p>`;
    return;
  }
  const groups = GROUP_ORDER.map((cat) => ({ cat, items: findings.filter((f) => f.category === cat.id) })).filter(
    (g) => g.items.length
  );

  container.innerHTML = groups
    .map(({ cat, items }) => {
      const redacted = items.filter((f) => !f.excluded).length;
      return `<section class="finding-group finding-group--${cat.id}">
        <h3 class="finding-group__title"><span class="finding-group__swatch" aria-hidden="true"></span>${escapeHtml(cat.label)}<span class="muted">${redacted}/${items.length}</span></h3>
        <ul class="finding-list">${items
          .map(
            (f) => `<li><label class="finding${f.excluded ? " is-kept" : ""}" title="${escapeHtml(preview(f.value, 200))}">
              <input type="checkbox" data-key="${escapeHtml(f.key)}"${f.excluded ? "" : " checked"}>
              <span class="finding__value">${escapeHtml(preview(f.value, 48))}</span>
              <code class="finding__token">${escapeHtml(f.token)}</code>
              ${f.count > 1 ? `<span class="finding__count" title="${plural(f.count, "occurrence")}">×${f.count}</span>` : ""}
            </label></li>`
          )
          .join("")}</ul>
      </section>`;
    })
    .join("");
}

/** Wire sidebar events to callbacks. */
export function bindReview({ termList, detectorList, findings }, handlers) {
  termList.addEventListener("click", (event) => {
    const button = event.target.closest(".term__remove");
    if (button) handlers.onRemoveTerm(button.dataset.termId);
  });
  termList.addEventListener("change", (event) => {
    const select = event.target.closest(".term__entity");
    if (select) handlers.onChangeTermEntity(select.dataset.termId, select.value);
  });
  detectorList.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-category]");
    if (input) handlers.onToggleCategory(input.dataset.category, input.checked);
  });
  findings.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-key]");
    if (input) handlers.onSetExcluded(input.dataset.key, !input.checked);
  });
}
