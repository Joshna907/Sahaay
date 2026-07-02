package mesh

import (
	"sort"
	"sync"
)

// Router holds the pure, network-free decision logic of the mesh: what have
// we already seen, what should we keep, and what should we forward. It is
// deliberately decoupled from libp2p so it can be unit-tested on its own
// (see router_test.go) — the hard part of a mesh is this logic, not the sockets.
type Router struct {
	mu    sync.Mutex
	seen  map[string]struct{}        // message IDs we've already handled (loop/echo guard)
	store map[string]DistressMessage // retained messages, for store-and-forward replay
}

func NewRouter() *Router {
	return &Router{
		seen:  make(map[string]struct{}),
		store: make(map[string]DistressMessage),
	}
}

// Accept records an incoming message. It returns:
//
//	isNew    - false if we've seen this ID before (caller should drop it: this
//	           is what stops a flooded message from looping around the mesh forever)
//	forward  - the message to relay onward (TTL decremented, RelayCount++),
//	           only valid when ok is true
//	ok       - true if the message still has hops left and should be forwarded
func (r *Router) Accept(m DistressMessage) (isNew bool, forward DistressMessage, ok bool) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, dup := r.seen[m.ID]; dup {
		return false, DistressMessage{}, false
	}
	r.seen[m.ID] = struct{}{}
	r.store[m.ID] = m

	if m.TTL <= 1 {
		// This hop is the last one; keep it but don't relay further.
		return true, DistressMessage{}, false
	}
	forward = m
	forward.TTL = m.TTL - 1
	forward.RelayCount = m.RelayCount + 1
	return true, forward, true
}

// Snapshot returns retained messages, most-urgent first (ties broken by
// recency). Used both to display state and to replay history to a peer that
// just joined — a newly-arrived rescuer immediately learns about the standing
// CRITICAL calls, not just messages sent after they connected.
func (r *Router) Snapshot() []DistressMessage {
	r.mu.Lock()
	msgs := make([]DistressMessage, 0, len(r.store))
	for _, m := range r.store {
		msgs = append(msgs, m)
	}
	r.mu.Unlock()

	sort.Slice(msgs, func(i, j int) bool {
		ri, rj := urgencyRank(msgs[i].Urgency), urgencyRank(msgs[j].Urgency)
		if ri != rj {
			return ri > rj
		}
		return msgs[i].CreatedAt.After(msgs[j].CreatedAt)
	})
	return msgs
}
