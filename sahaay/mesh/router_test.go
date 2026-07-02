package mesh

import (
	"testing"
	"time"
)

func msg(id, urgency string, ttl int) DistressMessage {
	return DistressMessage{ID: id, Urgency: urgency, TTL: ttl, CreatedAt: time.Now()}
}

// A message seen a second time must be dropped — this is the guard that stops
// a flooded message from circulating the mesh endlessly.
func TestAcceptDeduplicates(t *testing.T) {
	r := NewRouter()

	isNew, _, _ := r.Accept(msg("abc", "HIGH", 5))
	if !isNew {
		t.Fatal("first sighting should be new")
	}
	isNew, _, ok := r.Accept(msg("abc", "HIGH", 5))
	if isNew {
		t.Fatal("second sighting of same ID must not be new")
	}
	if ok {
		t.Fatal("a duplicate must never be forwarded")
	}
}

// Forwarding must decrement TTL and increment the hop count.
func TestAcceptDecrementsTTL(t *testing.T) {
	r := NewRouter()
	_, fwd, ok := r.Accept(msg("m1", "LOW", 5))
	if !ok {
		t.Fatal("message with TTL 5 should be forwardable")
	}
	if fwd.TTL != 4 {
		t.Fatalf("TTL should drop 5 -> 4, got %d", fwd.TTL)
	}
	if fwd.RelayCount != 1 {
		t.Fatalf("RelayCount should rise 0 -> 1, got %d", fwd.RelayCount)
	}
}

// A message on its last hop is kept but not relayed further, so it can't
// outlive its TTL budget.
func TestAcceptStopsAtLastHop(t *testing.T) {
	r := NewRouter()
	isNew, _, ok := r.Accept(msg("m2", "LOW", 1))
	if !isNew {
		t.Fatal("should still be accepted/stored")
	}
	if ok {
		t.Fatal("TTL 1 is the final hop and must not be forwarded")
	}
}

// The same logical message keeps a stable ID across hops, so relaying it
// (which changes TTL/RelayCount) is still recognised as a duplicate.
func TestStableIDAcrossHops(t *testing.T) {
	t0 := time.Unix(1000, 0)
	a := NewDistressMessage("peerA", "MEDICAL", "CRITICAL", "need insulin", 1.0, 2.0, t0)
	relayed := a
	relayed.TTL = a.TTL - 3
	relayed.RelayCount = 3
	if computeID(relayed) != a.ID {
		t.Fatal("ID must not change when only TTL/RelayCount change")
	}
}

// Snapshot returns CRITICAL messages ahead of LOW ones.
func TestSnapshotOrdersByUrgency(t *testing.T) {
	r := NewRouter()
	r.Accept(msg("low", "LOW", 5))
	r.Accept(msg("crit", "CRITICAL", 5))
	r.Accept(msg("med", "MEDIUM", 5))

	got := r.Snapshot()
	if got[0].Urgency != "CRITICAL" || got[len(got)-1].Urgency != "LOW" {
		t.Fatalf("expected CRITICAL first and LOW last, got order: %v", []string{got[0].Urgency, got[1].Urgency, got[2].Urgency})
	}
}
