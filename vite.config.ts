import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * The production security headers live in nginx/security-headers.conf. `npm run preview` serves the same
 * ones, so what you check locally (including the strict CSP) is what nginx sends.
 */
function securityHeaders(): Record<string, string> {
  const conf = readFileSync(fileURLToPath(new URL("./nginx/security-headers.conf", import.meta.url)), "utf8");
  const headers: Record<string, string> = {};
  for (const match of conf.matchAll(/^\s*add_header\s+([\w-]+)\s+"([^"]*)"\s+always;/gm)) {
    headers[match[1]] = match[2];
  }
  return headers;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 8000 },
  // No dev-server CSP: React refresh and HMR need inline scripts and a WebSocket.
  preview: { port: 8000, headers: securityHeaders() },
  build: {
    // The CSP has no data: in font-src, so never inline assets.
    assetsInlineLimit: 0
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx,mjs}"],
    css: false
  }
});
