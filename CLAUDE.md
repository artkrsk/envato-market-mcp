# CLAUDE.md

## What This Is

An MCP server wrapping the Envato Market API. Exposes 6 tools for purchase verification, item lookup, comment search, sales listing, earnings, and account info over stdio transport.

## Commands

```bash
pnpm build        # compile TypeScript to dist/
pnpm dev          # watch mode (tsc --watch)
pnpm start        # run compiled server (node dist/index.js)
pnpm exec tsc     # type-check without emitting
```

## Architecture

Two source files in `src/`:

- **index.ts** — MCP server setup. Validates env vars, registers 6 tools, connects via StdioServerTransport.
- **envato.ts** — Envato REST API client. GET helper with Bearer auth. Compact formatters strip verbose fields (HTML descriptions, previews, attributes) from API responses to fit LLM context windows.

## Key Details

- ESM project (`"type": "module"`) — all local imports use `.js` extensions.
- Envato API base: `https://api.envato.com` (v1 and v3 endpoints).
- Auth: Bearer token via `ENVATO_TOKEN` env var.
- Responses are compacted — list/sale endpoints strip nested Item objects down to essential fields.
- Invalid purchase codes return HTTP 404 with `{"error":404,"description":"..."}`.
