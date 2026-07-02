# Sahaay Desktop — Electron + React client

The desktop client for [Sahaay](../README.md). A React 19 + Vite + Tailwind UI, wrapped in Electron, that talks to the Go/GraphQL [backend](../sahaay/README.md).

## Highlights
- **Triage UI:** aid requests shown by severity, with CRITICAL messages visually flagged.
- **Backend-as-sidecar:** on launch, Electron (`electron/main.js`) spawns the compiled Go backend as a child process and terminates it on quit — the app is self-contained.
- **Map view:** Leaflet-based node/message map.

## Running
```bash
npm install
npm run start   # starts Vite, waits for it, then launches Electron
```
- `npm run dev` — React frontend only, in the browser (no Electron, no backend).
- `npm run start` — full desktop app (spawns the bundled Go backend; requires the backend binary to be built and MongoDB running).
- `npm run dist` — builds a packaged Windows installer via electron-builder.

## Notes
- The GraphQL endpoint defaults to `http://localhost:8080/query` (override with `VITE_GRAPHQL_URL`).
- Some status metrics (CPU, temperature) are currently simulated placeholders; battery uses the real browser Battery API. The "connected peers" view depends on the mesh layer, which is on the roadmap.

## Stack
React 19 · Vite · Tailwind CSS · Leaflet · Electron + electron-builder
