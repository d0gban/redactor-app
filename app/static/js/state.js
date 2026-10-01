// App state. Only preferences are ever persisted, and only when the user opts in.
import { CATEGORIES, defaultEnabledCategories } from "./engine/detectors.js";

const STORAGE_KEY = "redactor:prefs:v1";
const KNOWN_CATEGORIES = new Set(CATEGORIES.map((c) => c.id));

let nextTermId = 1;

export function makeTerm({ value, entity = "CUSTOM", caseSensitive = false, wholeWord = true }) {
  return { id: `t${nextTermId++}`, value: String(value).trim(), entity, caseSensitive: !!caseSensitive, wholeWord: !!wholeWord };
}

function readPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.remember !== true) return null;
    return {
      remember: true,
      terms: Array.isArray(data.terms) ? data.terms.filter((t) => t && t.value).map(makeTerm) : [],
      enabledCategories: Array.isArray(data.enabledCategories)
        ? new Set(data.enabledCategories.filter((id) => KNOWN_CATEGORIES.has(id)))
        : defaultEnabledCategories()
    };
  } catch {
    return null;
  }
}

function writePrefs(state) {
  try {
    if (!state.remember) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        remember: true,
        terms: state.terms.map(({ value, entity, caseSensitive, wholeWord }) => ({ value, entity, caseSensitive, wholeWord })),
        enabledCategories: Array.from(state.enabledCategories)
      })
    );
  } catch {
    // Storage disabled (private mode, policy) — preferences simply aren't remembered.
  }
}

export function createStore() {
  const prefs = readPrefs();
  const state = {
    source: "",
    reply: "",
    terms: prefs ? prefs.terms : [],
    enabledCategories: prefs ? prefs.enabledCategories : defaultEnabledCategories(),
    excluded: new Set(),
    remember: prefs ? prefs.remember : false,
    result: null,
    // Token map captured at the last copy, so Restore matches what was actually sent to the AI.
    copiedTokenMap: null,
    copiedAt: null
  };

  return {
    state,
    /** Persist preferences (or clear them when "remember" is off). */
    savePrefs() {
      writePrefs(state);
    }
  };
}
