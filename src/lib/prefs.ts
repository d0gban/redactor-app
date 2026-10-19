// Only preferences are ever persisted, and only when the user opts in. Prompt text never is.
import { CATEGORIES, defaultEnabledCategories } from "@/engine/detectors.js";

const STORAGE_KEY = "redactor:prefs:v1";
const KNOWN_CATEGORIES = new Set(CATEGORIES.map((c) => c.id));

export interface TermItem {
  id: string;
  value: string;
  entity: string;
  caseSensitive: boolean;
  wholeWord: boolean;
}

export interface Prefs {
  remember: boolean;
  terms: TermItem[];
  enabledCategories: Set<string>;
}

let nextTermId = 1;

export function makeTerm(term: { value: string; entity?: string; caseSensitive?: boolean; wholeWord?: boolean }): TermItem {
  return {
    id: `t${nextTermId++}`,
    value: String(term.value).trim(),
    entity: term.entity ?? "CUSTOM",
    caseSensitive: !!term.caseSensitive,
    wholeWord: term.wholeWord ?? true
  };
}

export function readPrefs(): Prefs | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.remember !== true) return null;
    return {
      remember: true,
      terms: Array.isArray(data.terms) ? data.terms.filter((t: { value?: string }) => t && t.value).map(makeTerm) : [],
      enabledCategories: Array.isArray(data.enabledCategories)
        ? new Set<string>(data.enabledCategories.filter((id: string) => KNOWN_CATEGORIES.has(id)))
        : defaultEnabledCategories()
    };
  } catch {
    return null;
  }
}

export function writePrefs({ remember, terms, enabledCategories }: Prefs) {
  try {
    if (!remember) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        remember: true,
        terms: terms.map(({ value, entity, caseSensitive, wholeWord }) => ({ value, entity, caseSensitive, wholeWord })),
        enabledCategories: Array.from(enabledCategories)
      })
    );
  } catch {
    // Storage disabled (private mode, policy): preferences simply aren't remembered.
  }
}
