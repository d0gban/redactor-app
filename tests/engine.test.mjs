import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { redact, restore, detect, normalizeEntity } from "../app/static/js/engine/redact.js";
import {
  CATEGORIES,
  defaultEnabledCategories,
  isValidIPv4,
  isValidIPv6,
  isValidUUID,
  luhnCheck,
  isLikelyPhone
} from "../app/static/js/engine/detectors.js";

const SAMPLE = readFileSync(new URL("./fixtures/sample.txt", import.meta.url), "utf8");
const ALL = new Set(CATEGORIES.map((c) => c.id));
const entities = (result) => new Set(result.findings.map((f) => f.entity));

test("detects every built-in entity in the sample fixture", () => {
  const found = entities(redact(SAMPLE, { enabledCategories: ALL }));
  for (const entity of [
    "EMAIL", "PHONE", "URL", "IPV4", "IPV6", "MAC", "UUID", "SESSION_ID", "BEARER_TOKEN",
    "JWT", "AWS_ACCESS_KEY", "STRIPE_KEY", "GITHUB_TOKEN", "SLACK_TOKEN", "CREDIT_CARD", "IBAN",
    "SG_NRIC_FIN", "SG_UEN", "WINDOWS_PATH", "UNIX_PATH", "DB_CONNECTION_STRING", "PRIVATE_KEY",
    "CERTIFICATE"
  ]) {
    assert.ok(found.has(entity), `expected ${entity}`);
  }
});

test("redacted sample leaks none of the original secrets", () => {
  const { output } = redact(SAMPLE, { enabledCategories: ALL });
  for (const secret of ["juan.delacruz@", "AKIAIOSFODNN7EXAMPLE", "4242 4242", "SuperSecret123", "MIIEvQ", "203.0.113.10"]) {
    assert.ok(!output.includes(secret), `leaked ${secret}`);
  }
});

test("domains and paths are off by default; filenames are never domains", () => {
  const text = "Edit app.py and routes.js, see /home/me/notes.md and README.md";
  assert.equal(redact(text).findings.length, 0);
  assert.ok(!defaultEnabledCategories().has("infra"));

  const withInfra = redact("Deploy to api.example.com then edit app.py", { enabledCategories: ALL });
  assert.deepEqual(
    withInfra.findings.map((f) => f.value),
    ["api.example.com"]
  );
});

test("the same value gets the same token; different values increment", () => {
  const text = "a@x.io wrote to b@x.io, then A@X.io replied";
  const r = redact(text);
  assert.equal(r.output, "[EMAIL_1] wrote to [EMAIL_2], then [EMAIL_1] replied");
  assert.equal(r.findings.length, 2);
  assert.equal(r.findings[0].count, 2);
  assert.equal(r.redactedCount, 3);
});

test("excluding a key keeps the original and does not renumber others", () => {
  const text = "a@x.io and b@x.io";
  const first = redact(text);
  const keyA = first.findings[0].key;
  const r = redact(text, { excluded: new Set([keyA]) });
  assert.equal(r.output, "a@x.io and [EMAIL_2]");
  assert.equal(r.findings.find((f) => f.key === keyA).excluded, true);
  assert.ok(!r.tokenMap.has("[EMAIL_1]"));
});

test("manual terms: whole word, case-insensitive, flexible whitespace, toggleable", () => {
  const terms = [{ value: "Juan Dela Cruz", entity: "person", wholeWord: true }];
  const text = "Juan  Dela\nCruz met juan dela cruz. JuanDelaCruzz is someone else.";
  const r = redact(text, { terms });
  assert.equal(r.output, "[PERSON_1] met [PERSON_1]. JuanDelaCruzz is someone else.");

  const key = r.findings[0].key;
  const kept = redact(text, { terms, excluded: new Set([key]) });
  assert.equal(kept.output, text);
});

test("whole-word terms do not match inside other words", () => {
  const r = redact("Ann reviewed the annual report", { terms: [{ value: "Ann", entity: "PERSON", wholeWord: true }] });
  assert.equal(r.output, "[PERSON_1] reviewed the annual report");
});

test("an excluded containing span lets an inner term show through and stays listed", () => {
  const terms = [{ value: "dogban", entity: "ORG", wholeWord: true }];
  const text = "mail juan@dogban.ai";
  const emailKey = redact(text, { terms }).findings.find((f) => f.entity === "EMAIL").key;
  const r = redact(text, { terms, excluded: new Set([emailKey]) });
  assert.equal(r.output, "mail juan@[ORG_1].ai");
  assert.ok(r.findings.some((f) => f.key === emailKey && f.excluded));
});

test("secret assignments redact only the value", () => {
  const r = redact('password = "hunter22" and api_key: q9X2mLr7Vt');
  assert.equal(r.output, 'password = "[SECRET_1]" and api_key: [SECRET_2]');
});

test("URLs drop trailing punctuation", () => {
  const r = redact("See (https://example.com/a?b=1).");
  assert.equal(r.output, "See ([URL_1]).");
});

test("restore round-trips and reports unknown tokens", () => {
  const terms = [{ value: "Juan Dela Cruz", entity: "PERSON", wholeWord: true }];
  const r = redact(SAMPLE, { terms, enabledCategories: ALL });
  assert.equal(restore(r.output, r.tokenMap).output, SAMPLE);

  const reply = restore("Ask [PERSON_1] about [EMAIL_99].", r.tokenMap);
  assert.equal(reply.output, "Ask Juan Dela Cruz about [EMAIL_99].");
  assert.equal(reply.restored, 1);
  assert.deepEqual(reply.unknown, ["[EMAIL_99]"]);
});

test("segments reconstruct the source exactly", () => {
  const r = redact(SAMPLE, { enabledCategories: ALL });
  assert.equal(r.segments.map((s) => s.text).join(""), SAMPLE);
});

test("phone heuristics skip dates and bare numbers", () => {
  assert.equal(isLikelyPhone("2024-01-15"), false);
  assert.equal(isLikelyPhone("123456789"), false);
  assert.equal(isLikelyPhone("+63 917 123 4567"), true);
  assert.equal(redact("Released 2024-01-15, order 123456789").findings.length, 0);
});

test("validators", () => {
  assert.ok(isValidIPv4("192.168.0.1"));
  assert.ok(!isValidIPv4("256.1.1.1"));
  assert.ok(isValidIPv6("2001:db8::1"));
  assert.ok(!isValidIPv6("10:30:45"));
  assert.ok(isValidUUID("550e8400-e29b-41d4-a716-446655440000"));
  assert.ok(!isValidUUID("550e8400-e29b-41d4-c716-446655440000"));
  assert.ok(luhnCheck("4242 4242 4242 4242"));
  assert.ok(!luhnCheck("4242 4242 4242 4243"));
});

test("detect respects disabled categories and empty input", () => {
  assert.deepEqual(detect(""), []);
  assert.equal(detect("a@b.io", { enabledCategories: new Set() }).length, 0);
});

test("normalizeEntity", () => {
  assert.equal(normalizeEntity(" client name "), "CLIENT_NAME");
  assert.equal(normalizeEntity(""), "CUSTOM");
});
