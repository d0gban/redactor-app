import { normalizeEntity } from "@/engine/redact.js";

/** Entity types a user term can be filed under. The value becomes the token prefix, e.g. [PERSON_1]. */
export const ENTITY_OPTIONS: ReadonlyArray<readonly [value: string, label: string]> = [
  ["PERSON", "Person"],
  ["ORG", "Organization"],
  ["PROJECT", "Project"],
  ["LOCATION", "Location"],
  ["CUSTOM", "Other"]
];

/** Longest name a user can give an "Other" term. */
export const CUSTOM_NAME_MAX = 20;

/** Token prefix for a user-named "Other" term. Tokens must start with a letter or restore won't find them. */
export function customEntity(name: string): string {
  const entity = normalizeEntity(name.slice(0, CUSTOM_NAME_MAX)).replace(/^[\d_]+/, "");
  return entity || "CUSTOM";
}

export function entityLabel(entity: string): string {
  const known = ENTITY_OPTIONS.find(([value]) => value === entity)?.[1];
  if (known) return known;
  const words = entity.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
