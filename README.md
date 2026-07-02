# Sahaay — Emergency Distress-Messaging System 🆘

[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![React + Vite](https://img.shields.io/badge/React_19_+_Vite-Frontend-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)

> **Sahaay** is an emergency distress-messaging system for disaster scenarios. Victims broadcast prioritised aid requests (food, water, medical, rescue); responders see them in a triage dashboard. It ships as a desktop app that bundles its own backend.
>
> The long-term goal is a fully **offline-first peer-to-peer mesh** so devices relay messages with no internet at all. This repo implements the **GraphQL backbone**, the **desktop client**, and a **working P2P mesh node** (libp2p + mDNS) that runs standalone today — wiring the mesh into the desktop app is the remaining step (see roadmap).

---

## ✅ What's built today

### Backend — Go + GraphQL (`/sahaay`)
- **GraphQL API** served with [`99designs/gqlgen`](https://github.com/99designs/gqlgen) over `localhost:8080`, with an interactive playground.
- **Domain model** for distress messaging: message types (`FOOD`/`WATER`/`MEDICAL`/`RESCUE`/`SHELTER`/`GENERAL`), urgency levels (`LOW`→`CRITICAL`), status lifecycle (`PENDING`→`DELIVERED`→`ACKNOWLEDGED`→`EXPIRED`), GPS location, and expiry.
- **MongoDB persistence** via the official Go driver so messages survive restarts.
- Implemented operations: `createUser`, `createDistressMessage`, `users`, `distressMessages`. *(Other resolvers — device/peer nodes, acknowledgements, filtered queries — are scaffolded but not yet implemented.)*

### Desktop client — Electron + React (`/sahaay-desktop`)
- **React 19 + Vite + Tailwind** tactical UI with a severity-based **message triage** view (CRITICAL messages are visually flagged) and a Leaflet map view.
- **Backend-as-sidecar:** Electron spawns the compiled Go binary as a child process on launch and shuts it down on quit — the app is self-contained.
- Polls the GraphQL API every 2s to refresh messages.

Heads-up on the status panel: battery is real (browser Battery API), but CPU and temperature are mocked for now, and the peers list stays empty until the mesh is wired into the desktop app.

### P2P mesh node — Go + libp2p (`/sahaay/mesh`, `/sahaay/cmd/meshnode`)
A standalone, runnable mesh node that needs no internet and no server:
- **Local discovery** over **mDNS** — nodes find each other on the LAN automatically.
- **Gossip flooding** — each node relays a message to all peers except the one it received it from.
- **Loop guard** — de-duplication by a content-addressed message ID (hash of the *immutable* fields only, so relaying never mints a "new" message and dedupe survives cluster merges).
- **Bounded flooding** — a **TTL** (hop limit) that decrements per hop, plus a **relay count** (the `ttl`/`relayCount` fields from the GraphQL schema, now actually used).
- **Store-and-forward** — a node retains messages and replays them (CRITICAL first) to any peer that joins later, so a device powering on mid-disaster still receives the standing calls.
- Routing logic (`mesh/router.go`) is decoupled from libp2p and covered by unit tests (`mesh/router_test.go`).

Try it — two terminals, same network, no server:
```bash
cd sahaay
go run ./cmd/meshnode -name alice -send   # broadcasts demo distress messages
go run ./cmd/meshnode -name bob           # discovers alice and receives/relays them
```

## 🗺️ Roadmap (next steps)
- **Wire the mesh into the desktop app** — currently the mesh node runs standalone; next is having the Electron/GraphQL layer publish and consume mesh messages so the UI's peer list and relaying go live.
- **Embedded local storage** (e.g. BoltDB) to remove the MongoDB server dependency and make the backend truly offline.
- **Signed messages / authentication** — use each peer's libp2p cryptographic identity to sign distress messages and prevent spoofed SOS calls (sender is currently a placeholder).
- **Partition-merge reconciliation** for when two isolated mesh clusters reconnect.

## 🧰 Tech Stack
* **Backend:** Go 1.23+, GraphQL ([99designs/gqlgen](https://github.com/99designs/gqlgen)), MongoDB (official driver)
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Leaflet
* **Desktop wrapper:** Electron & electron-builder

## 💻 Running it locally

### Prerequisites
- Go 1.23+
- Node.js & npm
- A running **MongoDB** instance on `mongodb://localhost:27017`

### 1. Start the backend (GraphQL API on :8080)
```bash
cd sahaay
go run .
```
Open `http://localhost:8080/` for the GraphQL playground.

### 2. Start the desktop app
```bash
cd sahaay-desktop
npm install
npm run start   # launches Vite, waits for it, then opens Electron
```
> `npm run dev` runs only the React frontend in a browser. The Electron shell (`npm run start`) is what spawns the bundled Go backend.

---
*Built to keep people connected when they need it most.*
