// @vitest-environment node
// The privacy guarantee lives in the headers nginx sends, so they are tested like code.
import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

// Comments are dropped so prose like "before a location is chosen" can't be mistaken for config.
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replace(/#.*$/gm, "");
const headersConf = read("nginx/security-headers.conf");
const serverConf = read("nginx/default.conf");

function headerValue(name: string): string {
  const match = headersConf.match(new RegExp(`^\\s*add_header\\s+${name}\\s+"([^"]*)"\\s+always;`, "m"));
  if (!match) throw new Error(`${name} header is missing from nginx/security-headers.conf`);
  return match[1];
}

function directive(csp: string, name: string): string[] {
  const entry = csp.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name} `));
  if (!entry) throw new Error(`CSP has no ${name}`);
  return entry.split(/\s+/).slice(1);
}

describe("Content-Security-Policy", () => {
  const csp = headerValue("Content-Security-Policy");

  test("cannot send data anywhere or run injected code", () => {
    expect(directive(csp, "default-src")).toEqual(["'none'"]);
    expect(directive(csp, "connect-src")).toEqual(["'none'"]);
    expect(directive(csp, "script-src")).toEqual(["'self'"]);
    expect(directive(csp, "style-src")).toEqual(["'self'"]);
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
  });

  test("fonts are same-origin files only; images may be data: URIs", () => {
    expect(directive(csp, "font-src")).toEqual(["'self'"]);
    expect(directive(csp, "img-src")).toEqual(["'self'", "data:"]);
  });

  test("cannot be framed, re-based or used to post forms", () => {
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'none'"]);
    expect(directive(csp, "form-action")).toEqual(["'none'"]);
  });
});

describe("other security headers", () => {
  test.each([
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["Referrer-Policy", "no-referrer"],
    ["Cross-Origin-Opener-Policy", "same-origin"],
    ["Cross-Origin-Resource-Policy", "same-origin"]
  ])("%s is %s", (name, value) => {
    expect(headerValue(name)).toBe(value);
  });

  test("camera, microphone and location are switched off", () => {
    const policy = headerValue("Permissions-Policy");
    for (const feature of ["camera", "microphone", "geolocation"]) expect(policy).toContain(`${feature}=()`);
  });

  test("HSTS is sent only when a proxy says the request was HTTPS", () => {
    expect(headersConf).toMatch(/add_header\s+Strict-Transport-Security\s+\$hsts\s+always;/);
    expect(serverConf).toMatch(/map\s+\$http_x_forwarded_proto\s+\$hsts\s*\{[^}]*default\s+""/);
  });
});

describe("server config", () => {
  // nginx drops inherited add_header lines once a location sets its own, so each location must include them.
  const locations = [...serverConf.matchAll(/location\s+([^{]+?)\s*\{([^}]*)\}/g)].map((m) => ({ path: m[1].trim(), body: m[2] }));

  test("has the expected locations", () => {
    expect(locations.map((l) => l.path)).toEqual(["= /healthz", "= /", "= /index.html", "/assets/", "/"]);
  });

  test.each(locations.map((l) => [l.path, l.body] as const))("location %s sends the security headers", (_path, body) => {
    expect(body).toContain("include /etc/nginx/security-headers.conf;");
  });

  test("replies sent before a location is chosen (the 405) also carry the security headers", () => {
    const serverLevel = serverConf.replace(/location\s+[^{]+\{[^}]*\}/g, "");
    expect(serverLevel).toContain("include /etc/nginx/security-headers.conf;");
  });

  test("the HTML shell is never cached; hashed assets are cached forever, but only when actually served", () => {
    const body = (path: string) => locations.find((l) => l.path === path)?.body ?? "";
    expect(body("= /")).toContain('Cache-Control "no-store"');
    expect(body("= /index.html")).toContain('Cache-Control "no-store"');
    expect(body("/")).toContain('Cache-Control "no-cache"');

    // A 404 for a missing hashed file must not be cached for a year.
    expect(body("/assets/")).toContain("Cache-Control $assets_cache_control always;");
    const map = serverConf.match(/map\s+\$status\s+\$assets_cache_control\s*\{([^}]*)\}/);
    expect(map, "nginx/default.conf needs a map on $status").not.toBeNull();
    expect(map![1]).toMatch(/default\s+"no-store";/);
    expect(map![1]).toMatch(/200\s+"[^"]*immutable[^"]*";/);
  });

  test("only GET and HEAD are served, with no request body", () => {
    expect(serverConf).toMatch(/\$request_method\s+!~\s+\^\(GET\|HEAD\)\$/);
    expect(serverConf).toContain("return 405;");
    expect(serverConf).toMatch(/client_max_body_size\s+1k;/);
  });

  test("unknown paths are 404s, not a fallback to the app", () => {
    expect(serverConf).not.toMatch(/try_files\s+\$uri[^;]*index\.html/);
    const serving = locations.filter((l) => ["/assets/", "/"].includes(l.path));
    for (const location of serving) expect(location.body).toContain("try_files $uri =404;");
  });

  test("healthcheck answers with JSON", () => {
    expect(serverConf).toContain("return 200 '{\"status\":\"ok\"}';");
  });
});
