# Recon

A local-first API client with semantic search over request history.

No account. No subscription. No cloud. Your requests and responses stay on your machine.

## Why

Postman requires an account, is bloated, and moved to a subscription model. Alternatives exist (Hoppscotch, Bruno, HTTP Forge) but none have semantic search over request history. When you have 500 saved requests and need to find "that one where I was testing the auth flow," keyword search fails. Recon finds it by meaning.

## Features

- **Semantic search** — Search request history by meaning, not keywords. "user account profile" finds a response containing "name, username, email." Powered by all-MiniLM-L6-v2 running locally via transformers.js. No API calls, no cloud.
- **Collections** — Organize requests into named collections. Filter history by collection.
- **Environment variables** — Define variables per environment (dev, staging, prod). Use `{{var}}` syntax in URL, headers, and body. Switch environments with one click.
- **Local-first** — All data in SQLite on your machine. No account, no sync, no telemetry.
- **Free** — No subscription, no account, no telemetry.

## Tech Stack

- Electron + Vite
- React 19
- better-sqlite3
- @xenova/transformers (local embeddings)
- FTS5 + cosine similarity fusion

## Development

```bash
npm install
npx electron-rebuild -f -w better-sqlite3
npm run dev
```

## Download

**[Recon v0.1.0 (Windows, portable)](https://github.com/d4r4ki4n/recon/releases/download/v0.1.0/Recon-0.1.0.exe)** — 119MB, no installer, just run it.

Source code is public (MIT). You can build from source for free, or download the pre-built binary. The source being public is the point: you can verify Recon never phones home. Privacy-first means verifiable, not just claimed.

## License

MIT