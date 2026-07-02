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

## Layout
- `server.go` — entrypoint; sets up the gqlgen server and DB connection.
- `db/mongodb.go` — MongoDB connection.
- `graph/` — GraphQL schema (`schema.graphqls`), resolvers, and generated code.

## Roadmap
The offline-first P2P mesh (libp2p + mDNS), message relaying, and embedded storage are planned — see the [top-level README](../README.md#️-roadmap-designed-not-yet-implemented).
