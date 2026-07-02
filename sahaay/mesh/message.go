// Package mesh implements Sahaay's offline peer-to-peer message layer:
// nodes discover each other on the local network and flood distress
// messages across multiple hops with no internet or central server.
package mesh

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// DistressMessage is one aid request as it travels across the mesh.
//
// The fields split into two groups, and the distinction matters:
//
//   - Immutable identity (Origin, Type, Urgency, Content, CreatedAt): set
//     once by the sender and never changed. The message ID is a hash of
//     exactly these fields, so the *same* logical message keeps the *same*
//     ID no matter how many nodes relay it. That is what makes de-duplication
//     work even when two isolated clusters later merge.
//   - Mutable transport state (TTL, RelayCount): rewritten on every hop.
//     They are deliberately excluded from the ID so relaying doesn't mint a
//     "new" message.
type DistressMessage struct {
	ID         string    `json:"id"`
	Origin     string    `json:"origin"` // peer ID that first created it
	Type       string    `json:"type"`   // FOOD / WATER / MEDICAL / RESCUE / SHELTER / GENERAL
	Urgency    string    `json:"urgency"`
	Content    string    `json:"content"`
	Lat        float64   `json:"lat"`
	Lon        float64   `json:"lon"`
	CreatedAt  time.Time `json:"createdAt"`
	TTL        int       `json:"ttl"`        // hops remaining; message dies at 0
	RelayCount int       `json:"relayCount"` // hops already travelled
}

// DefaultTTL bounds how far a message floods, so the network can't be
// swamped by a single message echoing forever.
const DefaultTTL = 8

// NewDistressMessage builds a message and stamps it with a content-addressed ID.
func NewDistressMessage(origin, msgType, urgency, content string, lat, lon float64, createdAt time.Time) DistressMessage {
	m := DistressMessage{
		Origin:    origin,
		Type:      msgType,
		Urgency:   urgency,
		Content:   content,
		Lat:       lat,
		Lon:       lon,
		CreatedAt: createdAt,
		TTL:       DefaultTTL,
	}
	m.ID = computeID(m)
	return m
}

// computeID hashes only the immutable fields (never TTL/RelayCount).
func computeID(m DistressMessage) string {
	seed := fmt.Sprintf("%s|%s|%s|%s|%d", m.Origin, m.Type, m.Urgency, m.Content, m.CreatedAt.UnixNano())
	sum := sha256.Sum256([]byte(seed))
	return hex.EncodeToString(sum[:8]) // 16 hex chars is plenty for a LAN mesh
}

// urgencyRank orders messages so the most critical propagate and display first.
func urgencyRank(urgency string) int {
	switch urgency {
	case "CRITICAL":
		return 3
	case "HIGH":
		return 2
	case "MEDIUM":
		return 1
	default: // LOW / unknown
		return 0
	}
}
