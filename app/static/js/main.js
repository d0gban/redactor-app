import { redact, restore, normalizeEntity } from "./engine/redact.js";
import { SAMPLE_PROMPT, SAMPLE_TERMS } from "./sample.js";
import { createStore, makeTerm } from "./state.js";
import { $, copyText, plural, toast } from "./ui/dom.js";
import { createEditor } from "./ui/editor.js";
import { initPaneTabs, initSplitter, initTablist } from "./ui/layout.js";
import { onTokenToggle, renderRedacted, renderRestored } from "./ui/output.js";
import { bindReview, renderDetectors, renderFindings, renderTerms } from "./ui/review.js";

// Inputs below this size are redacted synchronously on every keystroke; above it, debounced.
const INSTANT_LIMIT = 20_000;
// Above this size live mode is paused and redaction runs on demand.
const LIVE_LIMIT = 400_000;
const DEBOUNCE_MS = 200;

const store = createStore();
const { state } = store;

const el = {
  source: $("#source-text"),
  backdrop: $("#source-backdrop"),
  sourceStats: $("#source-stats"),
  largeNotice: $("#large-notice"),
  output: $("#output-view"),
  redactionCount: $("#redaction-count"),
  copyOutput: $("#copy-output-btn"),
  redactSelection: $("#redact-selection-btn"),
  termForm: $("#term-form"),
  termValue: $("#term-value"),
  termEntity: $("#term-entity"),
  termWholeWord: $("#term-whole-word"),
  termCase: $("#term-case"),
  termList: $("#term-list"),
  remember: $("#remember-toggle"),
  detectorList: $("#detector-list"),
  findings: $("#findings"),
  reply: $("#reply-text"),
  restored: $("#restored-view"),
  restoreInfo: $("#restore-info"),
  restoreCount: $("#restore-count"),
  restoreFooter: $("#restore-footer"),
  restoreBadge: $("#restore-badge"),
  copyRestored: $("#copy-restored-btn"),
  viewRedact: $("#view-redact"),
  viewRestore: $("#view-restore")
};

const editor = createEditor(el.source, el.backdrop);
const redactPanes = initPaneTabs(el.viewRedact);
initPaneTabs(el.viewRestore);
initSplitter($("#splitter"), $("#workspace"));

let activeView = "redact";
let restoreResult = null;

// ---------------------------------------------------------------- redaction

function runRedaction() {
  state.result = state.source
    ? redact(state.source, { terms: state.terms, enabledCategories: state.enabledCategories, excluded: state.excluded })
    : null;
  renderRedactView();
  if (activeView === "restore") runRestore();
  updateRestoreInfo();
}

let debounceTimer = 0;
function scheduleRedaction() {
  clearTimeout(debounceTimer);
  const size = state.source.length;
  const paused = size > LIVE_LIMIT;
  el.largeNotice.hidden = !paused;
  if (paused) {
    editor.render(null, state.source);
    return;
  }
  if (size <= INSTANT_LIMIT) runRedaction();
  else debounceTimer = setTimeout(runRedaction, DEBOUNCE_MS);
}

function renderRedactView() {
  const { result } = state;
  editor.render(result ? result.segments : null, state.source);
  renderRedacted(el.output, result, "Your redacted prompt appears here as you type.");
  renderFindings(el.findings, result ? result.findings : []);
  renderDetectors(el.detectorList, state.enabledCategories, result ? result.findings : []);

  const redacted = result ? result.redactedCount : 0;
  const unique = result ? result.findings.length : 0;
  el.redactionCount.textContent = `${redacted.toLocaleString()} redacted`;
  el.copyOutput.disabled = !result || !result.output;
  document.querySelectorAll('[data-count="findings"]').forEach((node) => {
    node.textContent = String(unique);
  });
  renderSourceStats();
}

function renderSourceStats() {
  const chars = state.source.length;
  el.sourceStats.textContent = chars
    ? `${plural(chars, "character")} · ~${plural(Math.ceil(chars / 4), "token")}`
    : "0 characters";
}

function setSource(text) {
  state.source = text;
  if (el.source.value !== text) el.source.value = text;
  if (!text) state.excluded.clear();
  scheduleRedaction();
}

function setExcluded(key, excluded) {
  if (excluded) state.excluded.add(key);
  else state.excluded.delete(key);
  runRedaction();
}

async function copySafePrompt() {
  if (state.source.length > LIVE_LIMIT || !state.result) runRedaction();
  const { result } = state;
  if (!result || !result.output) {
    toast("Nothing to copy yet.");
    return;
  }
  if (await copyText(result.output)) {
    state.copiedTokenMap = new Map(result.tokenMap);
    state.copiedAt = new Date();
    updateRestoreInfo();
    toast(`Safe prompt copied. ${plural(result.redactedCount, "value")} redacted.`, { tone: "success" });
  } else {
    toast("Copy failed. Select the text and copy it manually.", { tone: "error" });
  }
}

// ---------------------------------------------------------------- terms & detectors

function addTerm(value, entity = el.termEntity.value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const exists = state.terms.some((t) => t.value.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    toast(`"${trimmed}" is already in your terms.`);
    return false;
  }
  state.terms = [
    ...state.terms,
    makeTerm({
      value: trimmed,
      entity: normalizeEntity(entity),
      wholeWord: el.termWholeWord.checked,
      caseSensitive: el.termCase.checked
    })
  ];
  onTermsChanged();
  return true;
}

function onTermsChanged() {
  store.savePrefs();
  renderTerms(el.termList, state.terms);
  runRedaction();
}

el.termForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (addTerm(el.termValue.value)) {
    el.termValue.value = "";
    el.termValue.focus();
  }
});

el.redactSelection.addEventListener("click", () => {
  const selection = editor.getSelection().trim();
  if (!selection) return;
  if (addTerm(selection)) {
    const label = el.termEntity.selectedOptions[0]?.textContent || el.termEntity.value;
    toast(`Added "${selection}" as ${label}. You can change the type under Always redact.`, { tone: "success" });
  }
  updateSelectionButton();
});

function updateSelectionButton() {
  const selection = editor.getSelection().trim();
  el.redactSelection.disabled = !selection || selection.length > 200;
}
["select", "keyup", "mouseup", "input", "blur"].forEach((type) => el.source.addEventListener(type, updateSelectionButton));

bindReview(
  { termList: el.termList, detectorList: el.detectorList, findings: el.findings },
  {
    onRemoveTerm(id) {
      state.terms = state.terms.filter((t) => t.id !== id);
      onTermsChanged();
    },
    onChangeTermEntity(id, entity) {
      state.terms = state.terms.map((t) => (t.id === id ? { ...t, entity: normalizeEntity(entity) } : t));
      onTermsChanged();
    },
    onToggleCategory(category, enabled) {
      const next = new Set(state.enabledCategories);
      if (enabled) next.add(category);
      else next.delete(category);
      state.enabledCategories = next;
      store.savePrefs();
      runRedaction();
    },
    onSetExcluded: setExcluded
  }
);

function setAllExcluded(excluded) {
  if (!state.result) return;
  for (const f of state.result.findings) {
    if (excluded) state.excluded.add(f.key);
    else state.excluded.delete(f.key);
  }
  runRedaction();
}
$("#redact-all-btn").addEventListener("click", () => setAllExcluded(false));
$("#keep-all-btn").addEventListener("click", () => setAllExcluded(true));

el.remember.checked = state.remember;
el.remember.addEventListener("change", () => {
  state.remember = el.remember.checked;
  store.savePrefs();
  toast(state.remember ? "Terms and detector settings will be remembered on this device." : "Saved preferences cleared from this device.");
});

// ---------------------------------------------------------------- source panel

el.source.addEventListener("input", () => setSource(el.source.value));
onTokenToggle(el.output, (key) => setExcluded(key, !state.excluded.has(key)));

$("#run-now-btn").addEventListener("click", runRedaction);

$("#load-sample-btn").addEventListener("click", () => {
  const known = new Set(state.terms.map((t) => t.value.toLowerCase()));
  const extra = SAMPLE_TERMS.filter((t) => !known.has(t.value.toLowerCase())).map((t) => makeTerm(t));
  if (extra.length) {
    state.terms = [...state.terms, ...extra];
    store.savePrefs();
    renderTerms(el.termList, state.terms);
  }
  state.excluded.clear();
  setSource(SAMPLE_PROMPT);
  el.source.focus();
  el.source.setSelectionRange(0, 0);
  el.source.scrollTop = 0;
});

$("#clear-btn").addEventListener("click", () => {
  setSource("");
  el.source.focus();
});

el.copyOutput.addEventListener("click", copySafePrompt);

// ---------------------------------------------------------------- restore view

function activeTokenMap() {
  return state.copiedTokenMap || (state.result ? state.result.tokenMap : new Map());
}

function updateRestoreInfo() {
  const map = activeTokenMap();
  if (state.copiedTokenMap) {
    const time = state.copiedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    el.restoreInfo.textContent = `Using ${plural(map.size, "placeholder")} from the safe prompt you copied at ${time}.`;
  } else if (map.size) {
    el.restoreInfo.textContent = `Using ${plural(map.size, "placeholder")} from your current prompt. Copying the safe prompt locks this map.`;
  } else {
    el.restoreInfo.textContent = "Redact and copy a prompt first. The placeholder map exists only in this tab.";
  }
  el.restoreBadge.hidden = !map.size;
  el.restoreBadge.textContent = String(map.size);
}

function runRestore() {
  state.reply = el.reply.value;
  restoreResult = state.reply ? restore(state.reply, activeTokenMap()) : null;
  renderRestored(el.restored, restoreResult, "Original values are put back here.");
  const restoredCount = restoreResult ? restoreResult.restored : 0;
  el.restoreCount.textContent = `${restoredCount.toLocaleString()} restored`;
  el.copyRestored.disabled = !restoreResult || !restoreResult.output;

  const unknown = restoreResult ? restoreResult.unknown : [];
  el.restoreFooter.firstElementChild.textContent = unknown.length
    ? `${plural(unknown.length, "token")} not found in this session's map: ${unknown.slice(0, 5).join(", ")}${unknown.length > 5 ? "…" : ""}`
    : "";
  el.restoreFooter.classList.toggle("is-warning", unknown.length > 0);
}

el.reply.addEventListener("input", runRestore);
$("#clear-reply-btn").addEventListener("click", () => {
  el.reply.value = "";
  runRestore();
  el.reply.focus();
});

async function copyRestored() {
  if (!restoreResult || !restoreResult.output) {
    toast("Nothing to copy yet.");
    return;
  }
  const ok = await copyText(restoreResult.output);
  toast(ok ? "Restored reply copied." : "Copy failed. Select the text and copy it manually.", { tone: ok ? "success" : "error" });
}
el.copyRestored.addEventListener("click", copyRestored);

// ---------------------------------------------------------------- mode tabs & shortcuts

initTablist($(".mode-tabs"), (tab) => {
  activeView = tab.id === "tab-restore" ? "restore" : "redact";
  el.viewRedact.hidden = activeView !== "redact";
  el.viewRestore.hidden = activeView !== "restore";
  if (activeView === "restore") {
    runRestore();
    el.reply.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (activeView === "restore") copyRestored();
    else copySafePrompt();
    return;
  }
  if (event.key === "Escape") {
    const help = $(".help[open]");
    if (help) {
      help.open = false;
      help.querySelector("summary").focus();
    }
  }
});

// Close help when clicking outside it.
document.addEventListener("click", (event) => {
  const help = $(".help[open]");
  if (help && !help.contains(event.target)) help.open = false;
});

// ---------------------------------------------------------------- init

renderTerms(el.termList, state.terms);
renderRedactView();
updateRestoreInfo();
redactPanes.show("source");
