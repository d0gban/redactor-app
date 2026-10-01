# Prompt Redactor

Strip secrets and personal data from a prompt before you paste it into an AI tool, then put the real values back into the AI's reply.

Everything runs in the browser. The Flask server only serves static files; there is no API, no database, and the CSP sets `connect-src 'none'`, so the page cannot send your text anywhere.

## Features

- **Live detection** of API keys and tokens (AWS, OpenAI, Anthropic, Google, GitHub, Slack, Stripe, JWT, bearer, `password=…`), private keys, certificates, DB URLs, emails, phone numbers, URLs, IPv4/IPv6, MAC addresses, card numbers (Luhn-checked), IBANs, UUIDs and SG NRIC/FIN/UEN. Domains and file paths are opt-in because they are noisy in code.
- **Always redact terms** for names, companies and projects, with whole-word and match-case options. Select text in the prompt and press *Redact selection* to add a term.
- **Consistent numbered placeholders**: each unique value gets its own token (`[EMAIL_1]`, `[EMAIL_2]`), so the AI can still tell entities apart.
- **Click to keep**: click any token in the safe prompt, or untick it under *Findings*, to leave that value as-is.
- **Restore reply**: paste the AI's answer and the tokens are swapped back to the originals, using the map from the prompt you last copied. Unknown tokens are flagged.
- **Privacy**: optional *Remember on this device* saves only your terms and detector settings to `localStorage`. Your light/dark theme choice is also kept there. Prompt text is never stored.

## Project layout

```
app/
  __init__.py          create_app(), asset fingerprinting, security headers
  routes.py            /, /healthz, /favicon.ico
  security.py          CSP and other headers, cache policy
  static/js/
    engine/            pure redaction engine (no DOM). Also used by the tests.
      detectors.js     categories, regex detectors, validators
      redact.js        detect → resolve overlaps → tokenize → restore
    ui/                DOM modules (editor, output, review, layout, helpers)
    state.js           app state + opt-in preference storage
    main.js            wiring
  static/css/app.css   the only stylesheet (design tokens, light/dark)
tests/
  engine.test.mjs      engine tests (node:test)
  test_app.py          Flask tests (pytest)
```

## Run locally

```bash
python -m venv .venv
.venv/Scripts/activate         # Windows; use `source .venv/bin/activate` elsewhere
pip install -r requirements-dev.txt
FLASK_DEBUG=1 python run.py    # http://127.0.0.1:8000
```

## Test

```bash
npm test                       # or: node --test tests/engine.test.mjs  (Node 20+, no dependencies)
python -m pytest
```

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

The image runs gunicorn as a non-root user on a read-only filesystem. Put it behind HTTPS. The clipboard API requires a secure context; plain-HTTP deployments fall back to a legacy copy path.

Static assets are fingerprinted (`?v=<hash>`) and cached as immutable. ES module sub-imports revalidate with ETags, and HTML is `no-store`.
