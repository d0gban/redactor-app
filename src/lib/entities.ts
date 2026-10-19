/** Entity types a user term can be filed under. The value becomes the token prefix, e.g. [PERSON_1]. */
export const ENTITY_OPTIONS: ReadonlyArray<readonly [value: string, label: string]> = [
  ["PERSON", "Person"],
  ["ORG", "Organization"],
  ["PROJECT", "Project"],
  ["LOCATION", "Location"],
  ["CUSTOM", "Other"]
];

export function entityLabel(entity: string): string {
  return ENTITY_OPTIONS.find(([value]) => value === entity)?.[1] ?? entity;
}
