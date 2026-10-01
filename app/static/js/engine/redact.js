// Pure redaction pipeline: detect → resolve overlaps → tokenize → restore. No DOM.
import { CUSTOM_CATEGORY, DETECTORS, defaultEnabledCategories } from "./detectors.js";

const TERM_PRIORITY = 10;
const TOKEN_PATTERN = /\[([A-Z][A-Z0-9_]*?_\d+)\]/g;

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

export function normalizeEntity(raw) {
  const cleaned = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "CUSTOM";
}

function makeKey(entity, value, foldCase) {
  const v = String(value).replace(/\s+/g, " ");
  return `${entity}:${foldCase ? v.toLowerCase() : v}`;
}

function termRegExp(term) {
  const body = escapeRegExp(term.value.trim()).replace(/\s+/g, "\\s+");
  const source = term.wholeWord ? `(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_])` : body;
  return new RegExp(source, term.caseSensitive ? "gu" : "giu");
}

function findTermSpans(text, terms) {
  const spans = [];
  for (const term of terms) {
    if (!term || !String(term.value || "").trim()) continue;
    const entity = normalizeEntity(term.entity);
    for (const match of text.matchAll(termRegExp(term))) {
      if (!match[0]) continue;
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
        entity,
        category: CUSTOM_CATEGORY.id,
        priority: TERM_PRIORITY,
        key: makeKey(entity, match[0], !term.caseSensitive)
      });
    }
  }
  return spans;
}

function findDetectorSpans(text, enabledCategories) {
  const spans = [];
  for (const det of DETECTORS) {
    if (!enabledCategories.has(det.category)) continue;
    for (const match of text.matchAll(det.pattern)) {
      let value = match[0];
      let start = match.index;
      if (det.transform) {
        const transformed = det.transform(value);
        start += Math.max(0, value.indexOf(transformed));
        value = transformed;
      }
      if (!value) continue;
      if (det.validator && !det.validator(value)) continue;
      spans.push({
        start,
        end: start + value.length,
        value,
        entity: det.entity,
        category: det.category,
        priority: det.priority || 1,
        key: makeKey(det.entity, value, det.foldCase)
      });
    }
  }
  return spans;
}

/** All candidate spans, possibly overlapping. */
export function detect(text, { terms = [], enabledCategories = defaultEnabledCategories() } = {}) {
  if (!text) return [];
  return findTermSpans(text, terms).concat(findDetectorSpans(text, enabledCategories));
}

/** Greedy non-overlapping selection: earliest start, then longest, then highest priority. */
export function resolveOverlaps(spans) {
  const sorted = spans.slice().sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start) || b.priority - a.priority
  );
  const selected = [];
  let lastEnd = -1;
  for (const span of sorted) {
    if (span.start < lastEnd) continue;
    selected.push(span);
    lastEnd = span.end;
  }
  return selected;
}

function withoutOverlapping(spans, blockers) {
  // Both inputs are sorted and internally non-overlapping, so a two-pointer sweep suffices.
  const out = [];
  let j = 0;
  for (const span of spans) {
    while (j < blockers.length && blockers[j].end <= span.start) j++;
    if (j < blockers.length && blockers[j].start < span.end) continue;
    out.push(span);
  }
  return out;
}

/**
 * Redact `text`.
 * - `excluded`: Set of finding keys the user chose to keep as-is.
 * Returns the redacted string, render segments, per-value findings and the token → original map.
 */
export function redact(text, { terms = [], enabledCategories = defaultEnabledCategories(), excluded = new Set() } = {}) {
  const source = String(text || "");
  const candidates = detect(source, { terms, enabledCategories });

  const active = resolveOverlaps(candidates.filter((s) => !excluded.has(s.key)));
  // Kept (excluded) values are still shown so the user can re-enable them,
  // unless a redacted span already covers them.
  const kept = withoutOverlapping(resolveOverlaps(candidates.filter((s) => excluded.has(s.key))), active);

  const spans = active
    .map((s) => ({ ...s, excluded: false }))
    .concat(kept.map((s) => ({ ...s, excluded: true })))
    .sort((a, b) => a.start - b.start);

  // Number tokens over active and kept spans together so toggling one value never renumbers the others.
  const counters = new Map();
  const tokenByKey = new Map();
  const findings = new Map();
  const tokenMap = new Map();
  const segments = [];
  let output = "";
  let cursor = 0;

  for (const span of spans) {
    let token = tokenByKey.get(span.key);
    if (!token) {
      const n = (counters.get(span.entity) || 0) + 1;
      counters.set(span.entity, n);
      token = `[${span.entity}_${n}]`;
      tokenByKey.set(span.key, token);
    }

    let finding = findings.get(span.key);
    if (!finding) {
      finding = {
        key: span.key,
        entity: span.entity,
        category: span.category,
        value: span.value,
        token,
        count: 0,
        excluded: span.excluded
      };
      findings.set(span.key, finding);
    }
    finding.count += 1;

    if (span.start > cursor) {
      const plain = source.slice(cursor, span.start);
      segments.push({ type: "text", text: plain });
      output += plain;
    }

    segments.push({
      type: "span",
      text: span.value,
      token,
      key: span.key,
      entity: span.entity,
      category: span.category,
      excluded: span.excluded
    });

    if (span.excluded) {
      output += span.value;
    } else {
      output += token;
      if (!tokenMap.has(token)) tokenMap.set(token, span.value);
    }
    cursor = span.end;
  }

  if (cursor < source.length) {
    const plain = source.slice(cursor);
    segments.push({ type: "text", text: plain });
    output += plain;
  }

  // Excluded values hidden under another redaction must stay listed, or they could never be re-enabled.
  const hidden = new Set();
  for (const span of resolveOverlaps(candidates.filter((s) => excluded.has(s.key)))) {
    const existing = findings.get(span.key);
    if (existing) {
      if (hidden.has(span.key)) existing.count += 1;
      continue;
    }
    hidden.add(span.key);
    const n = (counters.get(span.entity) || 0) + 1;
    counters.set(span.entity, n);
    findings.set(span.key, {
      key: span.key,
      entity: span.entity,
      category: span.category,
      value: span.value,
      token: `[${span.entity}_${n}]`,
      count: 1,
      excluded: true
    });
  }

  const findingList = Array.from(findings.values());
  return {
    output,
    segments,
    findings: findingList,
    tokenMap,
    redactedCount: findingList.reduce((sum, f) => sum + (f.excluded ? 0 : f.count), 0)
  };
}

/** Replace `[ENTITY_N]` tokens with their originals. Unknown tokens are left in place and reported. */
export function restore(text, tokenMap) {
  const source = String(text || "");
  const segments = [];
  const unknown = new Set();
  let restored = 0;
  let output = "";
  let cursor = 0;

  for (const match of source.matchAll(TOKEN_PATTERN)) {
    const token = match[0];
    const original = tokenMap.get(token);
    if (match.index > cursor) {
      const plain = source.slice(cursor, match.index);
      segments.push({ type: "text", text: plain });
      output += plain;
    }
    if (original === undefined) {
      unknown.add(token);
      segments.push({ type: "unknown", text: token });
      output += token;
    } else {
      restored += 1;
      segments.push({ type: "restored", text: original, token });
      output += original;
    }
    cursor = match.index + token.length;
  }

  if (cursor < source.length) {
    const plain = source.slice(cursor);
    segments.push({ type: "text", text: plain });
    output += plain;
  }

  return { output, segments, restored, unknown: Array.from(unknown) };
}
