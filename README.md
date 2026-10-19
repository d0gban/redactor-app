# Prompt Redactor

Strip secrets and personal data from a prompt before you paste it into an AI tool, then put the real values back into the AI's reply.

Everything runs in the browser. It is a static React app: there is no server-side code, no API and no database. nginx serves the files with a strict Content-Security-Policy whose `connect-src 'none'` stops the page from sending your text anywhere, and a test checks that policy.

## Features

- **Live detection** of API keys and tokens (AWS, OpenAI, Anthropic, Google, GitHub, Slack, Stripe, JWT, bearer, `password=…`), private keys, certificates, DB URLs, emails, phone numbers, URLs, IPv4/IPv6, MAC addresses, card numbers (Luhn-checked), IBANs, UUIDs and SG NRIC/FIN/UEN. Domains and file paths are opt-in because they are noisy in code.
- **Always redact terms** for names, companies and projects, with whole-word and match-case options. Select text in the prompt and press *Redact selection* to add a term.
- **Consistent numbered placeholders**: each unique value gets its own token (`[EMAIL_1]`, `[EMAIL_2]`), so the AI can still tell entities apart.
- **Click to keep**: click any token in the safe prompt, or untick it under *Findings*, to leave that value as-is.
- **Restore reply**: paste the AI's answer and the tokens are swapped back to the originals, using the map from the prompt you last copied. Unknown tokens are flagged. Every restored value is color-coded like the redact view and linked to its token in your reply on hover; click one to keep it redacted in the output, and click again to restore it.
- **Privacy**: optional *Remember on this device* saves only your terms and detector settings to `localStorage`. Your light/dark theme choice is also kept there. Prompt text is never stored.

## Project layout

```
src/                     React 19 + TypeScript
  engine/                pure redaction engine (no DOM, plain JS with .d.ts types)
    detectors.js         categories, regex detectors, validators
    redact.js            detect → resolve overlaps → tokenize → restore
  styles/                tokens.css (design tokens, dark/light), editor.css, index.css (Tailwind)
  components/ui/         shadcn-style primitives (button, tabs, switch, ...) on Radix
  components/            panel kit, editors, token views, the two views
  hooks/                 useRedactor (all state and actions), hover link, media query
  lib/                   clipboard, theme, saved preferences, toasts, helpers
public/                  copied as-is: theme.js (sets the theme before first paint), favicon, icons
index.html               Vite entry
nginx/                   what serves the app in production
  default.conf           routes, caching, allowed methods, /healthz
  security-headers.conf  CSP and the other security headers (one source of truth)
tests/                   Vitest: engine, UI, security headers, build output
Dockerfile               builds with Node, serves with nginx (no Node in the final image)
```

Every pane is built from one panel anatomy (`components/panel.tsx`), and every colour, size and radius comes from `tokens.css`.

## Run locally

Needs Node 20 or newer.

```bash
npm ci                 # installs from the lockfile with install scripts disabled
npm run dev            # http://localhost:8000, hot reload
```

To check the production build with the production security headers:

```bash
npm run build          # type-checks, then builds into dist/
npm run preview        # http://localhost:8000, serves dist/ with nginx/security-headers.conf
```

`npm run dev` has no CSP, because hot reload needs inline scripts; use `preview` to see what production enforces.

## Test

```bash
npm test               # engine, UI, security headers and the built output (Vitest)
npm run build          # includes the TypeScript check
```

The security tests read `nginx/security-headers.conf` and `nginx/default.conf` and fail if the CSP gains `unsafe-inline`, if a location forgets the headers, or if a missing hashed file could be cached. A build test checks that `index.html` has no inline script or style and that the bundle contains no network APIs.

## Deploy

```bash
docker compose up --build -d   # http://localhost:8000, health check at /healthz
```

### Custom port

The app is served on port **8000** by default. To use another port you must create a `.env` file yourself. It is git-ignored, so it is not included when you clone the repo:

```bash
cp .env.example .env           # Windows PowerShell: Copy-Item .env.example .env
```

Then edit `.env`:

```
PORT=8080
```

Restart with `docker compose up -d` and open http://localhost:8080. If there is no `.env` file, or `PORT` is not set, port 8000 is used.

The image runs unprivileged nginx on a read-only filesystem. Put it behind HTTPS; behind a proxy that sets `X-Forwarded-Proto: https`, nginx adds the HSTS header. The clipboard API requires a secure context; plain-HTTP deployments fall back to a legacy copy path.

Caching: `index.html` is never cached. Everything under `/assets/` has a content hash in its name and is cached for a year, but only when the file was actually served (a 404 is never cached). Other files, such as `theme.js` and the icons, revalidate with an ETag.

### Other hosting

The build in `dist/` is plain static files, so any static host works. What matters is that it sends the headers in `nginx/security-headers.conf`, especially the CSP. A host that cannot set response headers cannot give the same guarantee.
