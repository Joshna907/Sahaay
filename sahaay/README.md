# Sahaay Backend — Go + GraphQL

The backend for [Sahaay](../README.md), an emergency distress-messaging system. It exposes a GraphQL API that the desktop client consumes.

## Stack
- **Language:** Go 1.23+
- **API:** GraphQL via [`99designs/gqlgen`](https://github.com/99designs/gqlgen)
- **Database:** MongoDB (official Go driver)

## What it does
- Serves a GraphQL API + playground on `localhost:8080`.
- Models distress messages: type, urgency, status lifecycle, GPS location, expiry.
- Persists users and distress messages to MongoDB.

### Implemented operations
| Type | Operation | Status |
|------|-----------|--------|
| Mutation | `createUser` | ✅ |
| Mutation | `createDistressMessage` | ✅ |
| Query | `users` | ✅ |
| Query | `distressMessages` | ✅ |
| Query/Mutation | device nodes, acknowledgements, filtered queries | 🚧 scaffolded, not yet implemented |

## Running
```bash
# Requires a MongoDB instance on mongodb://localhost:27017
go run .
```
Then open `http://localhost:8080/` for the GraphQL playground. The API endpoint is `POST /query`.

## P2P mesh node (`mesh/`, `cmd/meshnode/`)
A standalone libp2p + mDNS mesh node: local peer discovery, gossip flooding with TTL + hop count, de-duplication by content-addressed ID, and store-and-forward replay to late-joining peers. Routing logic lives in `mesh/router.go` and is unit-tested.

```bash
# Two terminals on the same network — no server, no internet:
go run ./cmd/meshnode -name alice -send
go run ./cmd/meshnode -name bob

# Run the routing unit tests:
go test ./mesh/
```

## Layout
- `server.go` — GraphQL server entrypoint; sets up gqlgen and the DB connection.
- `db/mongodb.go` — MongoDB connection.
- `graph/` — GraphQL schema (`schema.graphqls`), resolvers, and generated code.
- `mesh/` — P2P mesh: `message.go` (model + IDs), `router.go` (dedupe/TTL/ordering), `node.go` (libp2p host + mDNS + flooding).
- `cmd/meshnode/` — runnable single mesh node for the two-terminal demo above.

## Roadmap
The mesh node runs standalone today; wiring it into the GraphQL server + desktop app, embedded storage, and signed messages are next — see the [top-level README](../README.md#️-roadmap-next-steps).
