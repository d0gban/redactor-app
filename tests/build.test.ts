// @vitest-environment node
// Builds the app and inspects what would actually be served, against the CSP in nginx/security-headers.conf.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
let out = "";
let html = "";

beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), "redactor-build-"));
  await build({ root, configFile: join(root, "vite.config.ts"), logLevel: "silent", build: { outDir: out, emptyOutDir: true } });
  html = readFileSync(join(out, "index.html"), "utf8");
}, 120_000);

afterAll(() => rmSync(out, { recursive: true, force: true }));

const files = (dir: string): string[] =>
  readdirSync(join(out, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));

describe("index.html obeys the CSP", () => {
  test("has no inline script, style or event handler", () => {
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const [, attrs, body] of scripts) {
      expect(attrs).toMatch(/\bsrc="/);
      expect(body.trim()).toBe("");
    }
    expect(html).not.toMatch(/<style\b/);
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/\son[a-z]+=/i);
  });

  test("only references same-origin files that exist", () => {
    const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(3);
    for (const ref of refs) {
      expect(ref, `${ref} must be a same-origin absolute path`).toMatch(/^\/[^/]/);
      expect(existsSync(join(out, ref)), `${ref} is missing from the build`).toBe(true);
    }
  });

  test("loads the early theme script as a classic script before the app", () => {
    expect(html.indexOf('src="/theme.js"')).toBeGreaterThan(-1);
    expect(html.indexOf('src="/theme.js"')).toBeLessThan(html.indexOf('type="module"'));
    expect(html).not.toMatch(/<script[^>]*src="\/theme\.js"[^>]*type="module"/);
  });
});

describe("the bundle", () => {
  test("hashes every JS, CSS and font file name so nginx can cache them forever", () => {
    const assets = files("assets");
    expect(assets.some((f) => f.endsWith(".js"))).toBe(true);
    expect(assets.some((f) => f.endsWith(".css"))).toBe(true);
    expect(assets.some((f) => f.endsWith(".woff2"))).toBe(true);
    for (const file of assets) expect(file).toMatch(/-[\w-]{6,}\.\w+$/);
  });

  test("inlines nothing as a data: URI (the CSP allows no data: fonts)", () => {
    const css = files("assets").filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(out, f), "utf8")).join("\n");
    expect(css).not.toMatch(/url\(\s*["']?data:/);
    expect(css).toMatch(/url\(\/assets\/geist-/);
  });

  test("contains no network APIs: nothing in the app can phone home", () => {
    const js = files("assets").filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(out, f), "utf8")).join("\n");
    for (const api of ["XMLHttpRequest", "WebSocket", "EventSource", "sendBeacon", "importScripts"]) {
      expect(js, `${api} should not appear in the bundle`).not.toContain(api);
    }
  });

  test("copies the static files nginx serves from the root", () => {
    for (const file of ["theme.js", "favicon.ico", "icon/favicon-32x32.png", "icon/apple-touch-icon.png"]) {
      expect(existsSync(join(out, file)), file).toBe(true);
    }
  });
});
