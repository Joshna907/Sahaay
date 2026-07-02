# Sahaay — Emergency Distress-Messaging System 🆘

[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![React + Vite](https://img.shields.io/badge/React_19_+_Vite-Frontend-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)

> **Sahaay** is an emergency distress-messaging system for disaster scenarios. Victims broadcast prioritised aid requests (food, water, medical, rescue); responders see them in a triage dashboard. It ships as a desktop app that bundles its own backend.
>
> The long-term goal is a fully **offline-first peer-to-peer mesh** so devices relay messages with no internet at all. This repo currently implements the **centralised backbone and the desktop client** — the mesh layer is on the roadmap (see below).

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

> ⚠️ **Note:** Some status-panel metrics (CPU, temperature) are currently simulated placeholders, and the "connected peers" view depends on the not-yet-implemented mesh layer. Battery level uses the real browser Battery API.

## 🗺️ Roadmap (designed, not yet implemented)
- **Offline-first P2P mesh** using `libp2p` + mDNS for local peer discovery — no internet required.
- **Message propagation** across peers with `relayCount` + TTL and message-ID de-duplication (the schema already models these fields).
- **Embedded local storage** (e.g. BoltDB) to remove the MongoDB server dependency and make the app truly offline.
- Authentication / real sender identity (message sender is currently a placeholder).

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
