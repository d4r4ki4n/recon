# Community Post Drafts

## r/Backend (problem-focused, link in first comment)

**Title:** Keyword search on 500+ saved API requests is brutal. Anyone solved this?

**Body:**

I've got hundreds of saved requests across multiple projects. When I need to find "that endpoint where I was testing the auth flow," keyword search fails because the request is `POST /api/v2/sessions` — no mention of "auth" or "login" anywhere in the name, headers, or body.

Tried Postman, Hoppscotch, Bruno. All keyword-only search. None of them understand that "user account profile" should match a response containing `name, username, email`.

Ended up building my own thing that uses a local embedding model (all-MiniLM-L6-v2, runs on your machine) to index request history. You search by meaning, not keywords. No cloud calls, no API keys — the model runs locally.

Not trying to replace Postman's feature set. Just solving the one problem none of them solve: finding your stuff when you can't remember what you named it.

Link and details in the comments if anyone's curious. Happy to hear how other people handle this — maybe there's a tool I missed.

---

## r/softwaretesting (problem-focused, link in first comment)

**Title:** How do you find a specific API request in hundreds of saved ones? Keyword search keeps failing me.

**Body:**

Testing a multi-service app, I've got 400+ saved requests across environments. Half of them are named things like `POST /internal/v2/sessions` or `GET /api/users/{id}/permissions`. When I need to find "the one where I was debugging the permission check," keyword search gives me nothing — "permission" isn't in the request name, it's in the response body.

Every API client I've tried (Postman, Insomnia, Bruno, Hoppscotch) does keyword search only. None of them can match by meaning.

I ended up building a local-first client that indexes request history with a local embedding model. "Permission check" finds `GET /api/users/{id}/permissions`. "Authentication flow" finds `POST /api/v2/sessions`. Zero keyword overlap, pure semantic match.

The model (all-MiniLM-L6-v2) runs locally — no API calls, no cloud. All data stays in local SQLite.

Is semantic search over request history something others would find useful, or am I the only one with this specific pain point?

---

## r/SideProject (builder-focused, self-promotion encouraged)

**Title:** Shipped my first product — local API client with semantic search (no subscription, no account)

**Body:**

Been reading this sub for a while. Finally shipped something.

I'm a developer who got tired of Postman's bloat and the lack of semantic search in every alternative I tried. Every API client does keyword search. None of them can find "user account profile" in a response containing `name, username, email` — zero keyword overlap.

Built Recon:
- Local-first API client (Electron + SQLite)
- Semantic search over request history via local MiniLM embeddings (no cloud, no API calls)
- Collections, environment variables, named requests
- Source is public MIT — you can verify it doesn't phone home
- Pre-built binary is $39, build from source is free

The semantic search is the differentiator. "authentication login" finds a POST to `/api/v2/sessions`. "email address" finds a response with `name, username, email`. No keyword overlap needed.

This is my first shipped product. Not expecting to retire on it — just want to know if the semantic search angle resonates with anyone else who's been frustrated by keyword-only search in API tools.

GitHub: https://github.com/d4r4ki4n/recon