import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";

import { defaultEnabledCategories } from "@/engine/detectors.js";
import { normalizeEntity, redact, restore, type RedactResult, type RestoreResult } from "@/engine/redact.js";
import { copyText } from "@/lib/clipboard";
import { customEntity } from "@/lib/entities";
import { makeTerm, readPrefs, writePrefs, type TermItem } from "@/lib/prefs";
import { SAMPLE_PROMPT, SAMPLE_TERMS } from "@/lib/sample";
import { plural, preview } from "@/lib/text";
import { toast } from "@/lib/toast";

// Inputs below this size are redacted synchronously on every keystroke; above it, deferred so typing stays responsive.
const INSTANT_LIMIT = 20_000;
// Above this size live mode is paused and redaction runs on demand.
export const LIVE_LIMIT = 400_000;

export interface TermFormDefaults {
  entity: string;
  /** Token name for "Other" terms; blank keeps [CUSTOM_N]. */
  customName: string;
  wholeWord: boolean;
  caseSensitive: boolean;
}

/** The entity a new term gets from the form, with "Other" swapped for its custom name. */
export function resolveEntity(form: TermFormDefaults): string {
  return form.entity === "CUSTOM" ? customEntity(form.customName) : form.entity;
}

const EMPTY_MAP: Map<string, string> = new Map();

/** All app state and the actions on it. Rendering is left to the components. */
export function useRedactor() {
  const [initialPrefs] = useState(readPrefs);

  // ---- redact side
  const [source, setSourceText] = useState("");
  const [terms, setTerms] = useState<TermItem[]>(initialPrefs?.terms ?? []);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    initialPrefs?.enabledCategories ?? defaultEnabledCategories()
  );
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [remember, setRememberState] = useState(initialPrefs?.remember ?? false);
  const [termForm, setTermForm] = useState<TermFormDefaults>({ entity: "CUSTOM", customName: "", wholeWord: true, caseSensitive: false });

  // Which text the current result was computed from: live, deferred, or (while paused) the text at "Redact now".
  const deferred = useDeferredValue(source);
  const [frozen, setFrozen] = useState<string | null>(null);
  const paused = source.length > LIVE_LIMIT;
  if (!paused && frozen !== null) setFrozen(null);

  const applied = paused ? (frozen ?? "") : source.length <= INSTANT_LIMIT ? source : deferred;
  const result: RedactResult | null = useMemo(
    () => (applied ? redact(applied, { terms, enabledCategories, excluded }) : null),
    [applied, terms, enabledCategories, excluded]
  );
  /** The highlight layer must mirror the textarea exactly, so it only shows once the result is current. */
  const resultIsCurrent = applied === source;

  // ---- restore side
  const [reply, setReplyText] = useState("");
  const [keepRedacted, setKeepRedacted] = useState<Map<string, string>>(() => new Map());
  // Token map captured at the last copy, so Restore matches what was actually sent to the AI.
  const [copiedTokenMap, setCopiedTokenMap] = useState<Map<string, string> | null>(null);
  const [copiedAt, setCopiedAt] = useState<Date | null>(null);

  const tokenMap = copiedTokenMap ?? result?.tokenMap ?? EMPTY_MAP;

  /** Tokens the user chose to keep redacted, ignoring choices made against an older prompt's map. */
  const heldTokens = useMemo(() => {
    const held = new Set<string>();
    for (const [token, original] of keepRedacted) {
      if (tokenMap.get(token) === original) held.add(token);
    }
    return held;
  }, [keepRedacted, tokenMap]);

  const restoreResult: RestoreResult | null = useMemo(
    () => (reply ? restore(reply, tokenMap, { keep: heldTokens }) : null),
    [reply, tokenMap, heldTokens]
  );

  // ---- persistence (preferences only, and only when the user opts in)
  useEffect(() => {
    writePrefs({ remember, terms, enabledCategories });
  }, [remember, terms, enabledCategories]);

  // ---- redact actions
  const setSource = useCallback((text: string) => {
    setSourceText(text);
    if (!text) setExcluded(new Set());
  }, []);

  const redactNow = useCallback(() => setFrozen(source), [source]);

  const setKept = useCallback((key: string, kept: boolean) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (kept) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const setAllKept = useCallback(
    (kept: boolean) => {
      if (!result) return;
      setExcluded((prev) => {
        const next = new Set(prev);
        for (const finding of result.findings) {
          if (kept) next.add(finding.key);
          else next.delete(finding.key);
        }
        return next;
      });
    },
    [result]
  );

  const addTerm = useCallback(
    (value: string, entity: string = resolveEntity(termForm)): boolean => {
      const trimmed = String(value || "").trim();
      if (!trimmed) return false;
      if (terms.some((t) => t.value.toLowerCase() === trimmed.toLowerCase())) {
        toast(`"${preview(trimmed, 60)}" is already in your terms.`);
        return false;
      }
      setTerms((prev) => [
        ...prev,
        makeTerm({ value: trimmed, entity: normalizeEntity(entity), wholeWord: termForm.wholeWord, caseSensitive: termForm.caseSensitive })
      ]);
      return true;
    },
    [terms, termForm]
  );

  const removeTerm = useCallback((id: string) => setTerms((prev) => prev.filter((t) => t.id !== id)), []);

  const changeTermEntity = useCallback(
    (id: string, entity: string) =>
      setTerms((prev) => prev.map((t) => (t.id === id ? { ...t, entity: normalizeEntity(entity) } : t))),
    []
  );

  const toggleCategory = useCallback((category: string, enabled: boolean) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(category);
      else next.delete(category);
      return next;
    });
  }, []);

  const setRemember = useCallback((value: boolean) => {
    setRememberState(value);
    toast(value ? "Terms and detector settings will be remembered on this device." : "Saved preferences cleared from this device.");
  }, []);

  const loadSample = useCallback(() => {
    const known = new Set(terms.map((t) => t.value.toLowerCase()));
    const extra = SAMPLE_TERMS.filter((t) => !known.has(t.value.toLowerCase())).map((t) => makeTerm(t));
    if (extra.length) setTerms((prev) => [...prev, ...extra]);
    setExcluded(new Set());
    setSourceText(SAMPLE_PROMPT);
  }, [terms]);

  const copySafePrompt = useCallback(async () => {
    // A stale or paused result must not be copied: recompute from the text as it is now.
    const fresh = result && resultIsCurrent ? result : source ? redact(source, { terms, enabledCategories, excluded }) : null;
    if (paused) setFrozen(source);
    if (!fresh || !fresh.output) {
      toast("Nothing to copy yet.");
      return;
    }
    if (await copyText(fresh.output)) {
      setCopiedTokenMap(new Map(fresh.tokenMap));
      setCopiedAt(new Date());
      toast(`Safe prompt copied. ${plural(fresh.redactedCount, "value")} redacted.`, { tone: "success" });
    } else {
      toast("Copy failed. Select the text and copy it manually.", { tone: "error" });
    }
  }, [result, resultIsCurrent, source, terms, enabledCategories, excluded, paused]);

  // ---- restore actions
  const setReply = useCallback((text: string) => {
    setReplyText(text);
    if (!text) setKeepRedacted(new Map());
  }, []);

  const toggleHeld = useCallback(
    (token: string) => {
      if (!tokenMap.has(token)) return;
      setKeepRedacted((prev) => {
        const next = new Map(prev);
        if (heldTokens.has(token)) next.delete(token);
        else next.set(token, tokenMap.get(token) as string);
        return next;
      });
    },
    [tokenMap, heldTokens]
  );

  const copyRestored = useCallback(async () => {
    if (!restoreResult || !restoreResult.output) {
      toast("Nothing to copy yet.");
      return;
    }
    const ok = await copyText(restoreResult.output);
    toast(ok ? "Restored reply copied." : "Copy failed. Select the text and copy it manually.", { tone: ok ? "success" : "error" });
  }, [restoreResult]);

  const restoreInfo = useMemo(() => {
    if (copiedTokenMap && copiedAt) {
      const time = copiedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `Using ${plural(copiedTokenMap.size, "placeholder")} from the safe prompt you copied at ${time}.`;
    }
    if (tokenMap.size) {
      return `Using ${plural(tokenMap.size, "placeholder")} from your current prompt. Copying the safe prompt locks this map.`;
    }
    return "Redact and copy a prompt first. The placeholder map exists only in this tab.";
  }, [copiedTokenMap, copiedAt, tokenMap]);

  return {
    // redact
    source,
    setSource,
    result,
    resultIsCurrent,
    paused,
    redactNow,
    terms,
    termForm,
    setTermForm,
    addTerm,
    removeTerm,
    changeTermEntity,
    enabledCategories,
    toggleCategory,
    excluded,
    setKept,
    setAllKept,
    remember,
    setRemember,
    loadSample,
    copySafePrompt,
    // restore
    reply,
    setReply,
    restoreResult,
    restoreInfo,
    mapSize: tokenMap.size,
    toggleHeld,
    copyRestored
  };
}

export type Redactor = ReturnType<typeof useRedactor>;
