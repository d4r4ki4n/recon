# Community Post Drafts

## r/Backend / r/softwaretesting (problem-focused)

**Title:** I built a local API client because I got tired of Postman's bloat — it has semantic search over request history

**Body:**

I kept seeing the same complaints about Postman: requires an account, bloated, subscription model. The alternatives (Hoppscotch, Bruno) are good but none of them solve the problem I actually had — finding a specific request in hundreds of saved ones.

Keyword search fails when you're looking for "that endpoint where I was testing the auth flow" and the request is named `POST /api/v2/sessions` with no mention of "auth" or "login" anywhere.

So I built Recon. It uses a local embedding model (all-MiniLM-L6-v2, runs on your machine, no API calls) to index your request history. You search by meaning: "user account profile" finds a response containing "name, username, email" with zero keyword overlap.

- No account, no cloud, no telemetry
- All data in local SQLite
- Collections and environment variables
- One-time purchase ($29), source is public (MIT) so you can verify it doesn't phone home
- Windows portable binary available

Not trying to compete with Postman's feature set. Just trying to solve the one problem they don't: finding your stuff.

GitHub: https://github.com/d4r4ki4n/recon

Feedback welcome, especially on what's missing for your workflow.

---

## r/SideProject (builder-focused)

**Title:** Shipped my first product — local API client with semantic search (no subscription, no account)

**Body:**

Been reading this sub for a while. The 9,300-post analysis someone did a while back stuck with me — 7% of "I wish there was" posts wanted offline-first/privacy-focused tools. Subscription fatigue is real.

I'm a developer who got tired of Postman's bloat and the lack of semantic search in every alternative I tried. Built Recon:

- Local-first API client (Electron + SQLite)
- Semantic search over request history via local MiniLM embeddings (no cloud)
- Collections, environment variables, named requests
- Source is public MIT — you can verify it doesn't phone home
- Pre-built binary is $29, build from source is free

The semantic search is the differentiator. "authentication login" finds a POST to `/api/v2/sessions`. "email address" finds a response with `name, username, email`. No keyword overlap needed.

This is my first shipped product. Not expecting to retire on it — just want to know if the semantic search angle resonates with anyone else who's been frustrated by keyword-only search in API tools.

GitHub: https://github.com/d4r4ki4n/recon