# Sahaay: Offline-First Emergency Mesh Network 🛜

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![React + Vite](https://img.shields.io/badge/React_Vite-Frontend-61DAFB?style=for-the-badge&logo=react)](#)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron)](#)

> **Sahaay** is a localized, offline-first tactical mesh network designed to maintain critical communication during internet blackouts and natural disasters. 



##  The Architecture

Sahaay operates through a dual-interface system powered by a robust Go backend utilizing `libp2p` for decentralized peer discovery.

### 1. The Core Backend (Go + Libp2p)
- **True Peer-to-Peer:** Uses multi-address mDNS to discover and connect to local network nodes entirely without the internet.
- **Event-Driven State:** Operates on an atomic `UIManager` using buffered channels to guarantee thread-safe data synchronization.
- **GraphQL APIs:** Uses `gqlgen` to serve a high-performance local API over `localhost` for the UI to consume.
- **Persistent Storage:** Utilizes `bbolt` and `sqlite` to persist critical medical and SOS logs locally on the device.

### 2. The Tactical UI (Electron + React)
- **Offline Capable:** Packaged as a desktop application so first-responders don't require browsers or domains.
- **Live System Monitoring:** Interfaces directly with machine stats (Battery, Connectivity) to give operators a true tactical overview.
- **Message Prioritization:** Triage system ranging from `Low` to `CRITICAL` with visual alerting.

##  Tech Stack
* **Backend:** Go (1.24.6), Libp2p, GraphQL (99designs/gqlgen), BoltDB
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Leaflet (Mapping)
* **Desktop Wrapper:** Electron & Electron Builder

## 💻 Running it Locally

### Prerequisites
- Go 1.24+
- Node.js & npm

### Starting the Mesh Node
```bash
cd sahaay
go run main.go
```

### Starting the Desktop Interface
```bash
cd sahaay-desktop
npm install
npm run dev
```

---
*Built to keep people connected when they need it most.*
