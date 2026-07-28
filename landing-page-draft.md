# Recon

A local-first API client with semantic search.

## The problem
You have 500 saved API requests. You need to find "that one where I was testing the auth flow." Every API client gives you keyword search. If your request URL was `/api/v2/sessions` and your response body said `"token_type": "Bearer"`, searching "authentication login" finds nothing.

## The fix
Recon uses local semantic embeddings (all-MiniLM-L6-v2, runs on your machine, no cloud) to index every request and response. Search by meaning, not keywords.

- "authentication login" finds `/api/v2/sessions` with `"token_type": "Bearer"`
- "user account profile" finds `/api/users/42` with `"name, username, email"`
- "comments feedback" finds `/api/posts/7/comments`

## Why local-first
- No account required
- No telemetry
- No cloud
- Your API requests and responses never leave your machine
- Source is MIT — you can verify all of the above

## Features
- Semantic search over full request/response history
- Collections for organizing requests
- Environment variables with `{{var}}` substitution
- Named requests
- All standard HTTP methods
- JSON response formatting
- SQLite storage — your data is a file, not a service

## Pricing
$39 one-time purchase. No subscription. No account. Download and run.

Source code is MIT licensed at [github.com/d4r4ki4n/recon](https://github.com/d4r4ki4n/recon). Build it yourself for free, or buy the pre-built binary for convenience.

## Download
[Windows portable binary — v0.1.0](https://github.com/d4r4ki4n/recon/releases/tag/v0.1.0)

macOS and Linux builds coming.