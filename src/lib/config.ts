// Import/export of redaction settings (terms + detector toggles) as JSON. Prompt text is never included.
// An imported file is untrusted input: every field is checked and copied into fresh objects, never merged.
import { CATEGORIES } from "@/engine/detectors.js";
import { customEntity, ENTITY_OPTIONS } from "@/lib/entities";
import type { TermItem } from "@/lib/prefs";

export const CONFIG_FORMAT = "redactor-config";
export const CONFIG_VERSION = 1;
export const CONFIG_MAX_BYTES = 256 * 1024;
export const CONFIG_MAX_TERMS = 1000;
/** Same cap as the term input. */
export const TERM_MAX_LENGTH = 200;

const KNOWN_ENTITIES = new Set(ENTITY_OPTIONS.map(([value]) => value));
const KNOWN_CATEGORIES = new Set(CATEGORIES.map((c) => c.id));
// Control characters other than ordinary whitespace, invisible format characters (bidi overrides,
// zero-width spaces) and lone surrogates: none belong in a term, and they can hide what a term really matches.
const UNSAFE_CHARS = /[^\P{Cc}\t\n\r]|[\p{Cf}\p{Cs}]/u;

export interface TermInput {
  value: string;
  entity: string;
  caseSensitive: boolean;
  wholeWord: boolean;
}

export interface RedactorConfig {
  terms: TermInput[];
  /** Absent when the file doesn't set detectors; the current toggles are then kept. */
  enabledCategories: Set<string> | null;
}

export type ConfigResult = { ok: true; config: RedactorConfig; skipped: number } | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeEntity(raw: unknown): string {
  if (typeof raw !== "string") return "CUSTOM";
  return KNOWN_ENTITIES.has(raw) ? raw : customEntity(raw);
}

/** One term from untrusted data, or null when it can't be used as-is. */
export function sanitizeTerm(raw: unknown): TermInput | null {
  if (!isPlainObject(raw) || typeof raw.value !== "string") return null;
  const value = raw.value.trim();
  if (!value || value.length > TERM_MAX_LENGTH || UNSAFE_CHARS.test(value)) return null;
  return {
    value,
    entity: sanitizeEntity(raw.entity),
    caseSensitive: raw.caseSensitive === true,
    wholeWord: raw.wholeWord !== false
  };
}

/** Valid, de-duplicated terms (case-insensitive, first one wins) plus how many were dropped. */
export function sanitizeTerms(raw: unknown[]): { terms: TermInput[]; skipped: number } {
  const seen = new Set<string>();
  const terms: TermInput[] = [];
  for (const item of raw) {
    const term = sanitizeTerm(item);
    if (!term || seen.has(term.value.toLowerCase())) continue;
    seen.add(term.value.toLowerCase());
    terms.push(term);
  }
  return { terms, skipped: raw.length - terms.length };
}

export function sanitizeCategories(raw: unknown[]): Set<string> {
  return new Set(raw.filter((id): id is string => typeof id === "string" && KNOWN_CATEGORIES.has(id)));
}

export function serializeConfig(terms: TermItem[], enabledCategories: Set<string>): string {
  return JSON.stringify(
    {
      format: CONFIG_FORMAT,
      version: CONFIG_VERSION,
      terms: terms.map(({ value, entity, caseSensitive, wholeWord }) => ({ value, entity, caseSensitive, wholeWord })),
      enabledCategories: CATEGORIES.map((c) => c.id).filter((id) => enabledCategories.has(id))
    },
    null,
    2
  );
}

export function parseConfig(text: string): ConfigResult {
  if (text.length > CONFIG_MAX_BYTES) return { ok: false, error: "That file is too large to be a settings file." };
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!isPlainObject(data) || data.format !== CONFIG_FORMAT) {
    return { ok: false, error: "That file isn't a Redactor settings export." };
  }
  if (data.version !== CONFIG_VERSION) {
    return {
      ok: false,
      error: typeof data.version === "number" && data.version > CONFIG_VERSION
        ? "That file was made by a newer version of Redactor."
        : "That settings file has an unknown version."
    };
  }
  if (!Array.isArray(data.terms)) return { ok: false, error: "That settings file has no terms list." };
  if (data.terms.length > CONFIG_MAX_TERMS) {
    return { ok: false, error: `That file has more than ${CONFIG_MAX_TERMS.toLocaleString()} terms.` };
  }
  if (data.enabledCategories !== undefined && !Array.isArray(data.enabledCategories)) {
    return { ok: false, error: "That settings file has an invalid detectors list." };
  }
  const { terms, skipped } = sanitizeTerms(data.terms);
  const enabledCategories = Array.isArray(data.enabledCategories) ? sanitizeCategories(data.enabledCategories) : null;
  return { ok: true, config: { terms, enabledCategories }, skipped };
}

/**
 * Name and size are checked before the file is read, so a huge file is never loaded. The MIME type isn't:
 * browsers report .json inconsistently, and the content checks in parseConfig are what count.
 */
export async function readConfigFile(file: File): Promise<ConfigResult> {
  if (!/\.json$/i.test(file.name)) {
    return { ok: false, error: "Choose a .json settings file." };
  }
  if (file.size > CONFIG_MAX_BYTES) return { ok: false, error: "That file is too large to be a settings file." };
  try {
    return parseConfig(await file.text());
  } catch {
    return { ok: false, error: "That file couldn't be read." };
  }
}
