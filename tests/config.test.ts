import { describe, expect, test } from "vitest";

import { CONFIG_MAX_BYTES, CONFIG_MAX_TERMS, parseConfig, readConfigFile, serializeConfig } from "@/lib/config";
import { makeTerm } from "@/lib/prefs";

const wrap = (body: Record<string, unknown>) => JSON.stringify({ format: "redactor-config", version: 1, terms: [], ...body });

function parsed(text: string) {
  const result = parseConfig(text);
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe("settings export/import", () => {
  test("round-trips terms and detector toggles, and never includes anything else", () => {
    const terms = [makeTerm({ value: "Acme Corp", entity: "ORG" }), makeTerm({ value: "ABC-123", entity: "TICKET_ID", caseSensitive: true, wholeWord: false })];
    const text = serializeConfig(terms, new Set(["secrets", "infra"]));
    expect(Object.keys(JSON.parse(text))).toEqual(["format", "version", "terms", "enabledCategories"]);
    const { config, skipped } = parsed(text);
    expect(skipped).toBe(0);
    expect(config.terms).toEqual([
      { value: "Acme Corp", entity: "ORG", caseSensitive: false, wholeWord: true },
      { value: "ABC-123", entity: "TICKET_ID", caseSensitive: true, wholeWord: false }
    ]);
    expect([...(config.enabledCategories ?? [])]).toEqual(["secrets", "infra"]);
  });

  test.each([
    ["not JSON", "{nope", "valid JSON"],
    ["a JSON array", "[]", "Redactor settings"],
    ["another app's file", JSON.stringify({ terms: [] }), "Redactor settings"],
    ["a newer version", wrap({ version: 2 }), "newer version"],
    ["a string version", wrap({ version: "1" }), "unknown version"],
    ["terms that aren't a list", wrap({ terms: "Acme" }), "no terms list"],
    ["detectors that aren't a list", wrap({ enabledCategories: "secrets" }), "detectors list"],
    ["too many terms", wrap({ terms: Array.from({ length: CONFIG_MAX_TERMS + 1 }, (_, i) => ({ value: `t${i}` })) }), "more than"]
  ])("rejects %s", (_, text, message) => {
    const result = parseConfig(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });

  test("drops invalid, unsafe and duplicate terms and counts them", () => {
    const { config, skipped } = parsed(
      wrap({
        terms: [
          { value: "  Jane Doe  ", entity: "PERSON" },
          { value: "jane doe" },
          { value: "" },
          { value: 42 },
          null,
          "Acme",
          { value: "x".repeat(201) },
          { value: "pay‮roll" },
          { value: "zero​width" },
          { value: "nul\u0000byte" },
          { value: "lone \uD800 surrogate" }
        ]
      })
    );
    expect(config.terms.map((t) => t.value)).toEqual(["Jane Doe"]);
    expect(skipped).toBe(10);
  });

  test("forces entities into safe token prefixes and booleans into booleans", () => {
    const { config } = parsed(
      wrap({
        terms: [
          { value: "a", entity: "]<img src=x onerror=alert(1)>" },
          { value: "b", entity: "123 ticket id" },
          { value: "c", entity: { toString: "x" } },
          { value: "d", caseSensitive: "yes", wholeWord: 0 }
        ]
      })
    );
    expect(config.terms.map((t) => t.entity)).toEqual(["IMG_SRC_X_ONERROR", "TICKET_ID", "CUSTOM", "CUSTOM"]);
    for (const entity of config.terms.map((t) => t.entity)) expect(entity).toMatch(/^[A-Z][A-Z0-9_]{0,19}$/);
    expect(config.terms[3]).toMatchObject({ caseSensitive: false, wholeWord: true });
  });

  test("ignores unknown detector ids and keeps current toggles when the file sets none", () => {
    expect([...(parsed(wrap({ enabledCategories: ["secrets", "nope", 7, "__proto__"] })).config.enabledCategories ?? [])]).toEqual(["secrets"]);
    expect(parsed(wrap({})).config.enabledCategories).toBeNull();
  });

  test("a __proto__ key can't pollute objects", () => {
    parsed('{"format":"redactor-config","version":1,"terms":[{"value":"a","__proto__":{"polluted":true}}],"__proto__":{"polluted":true}}');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  test("accepts a UTF-8 BOM", () => {
    expect(parseConfig(`﻿${wrap({})}`).ok).toBe(true);
  });

  test("checks the file name and size before reading it", async () => {
    const notJson = await readConfigFile(new File([wrap({})], "settings.txt"));
    expect(notJson).toEqual({ ok: false, error: "Choose a .json settings file." });
    const huge = await readConfigFile(new File(["x".repeat(CONFIG_MAX_BYTES + 1)], "settings.json"));
    expect(huge.ok).toBe(false);
    expect(huge).toEqual({ ok: false, error: "That file is too large to be a settings file." });
    const good = await readConfigFile(new File([wrap({ terms: [{ value: "Acme" }] })], "Settings.JSON"));
    expect(good.ok && good.config.terms.map((t) => t.value)).toEqual(["Acme"]);
  });
});
