package mesh

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/protocol"
	"github.com/libp2p/go-libp2p/p2p/discovery/mdns"
)

const (
	protocolID = protocol.ID("/sahaay/distress/1.0.0")
	serviceTag = "sahaay-mesh" // mDNS rendezvous name; peers with the same tag find each other
)

// Node is one device in the mesh: a libp2p host that discovers local peers
// over mDNS and floods distress messages between them. Routing decisions
// (dedupe, TTL, ordering) live in Router; Node just does the networking.
type Node struct {
	host      host.Host
	router    *Router
	ctx       context.Context
	onMessage func(DistressMessage, bool) // callback: (msg, isRelay) for display
}

// NewNode starts a libp2p host, registers the distress stream handler, and
// begins mDNS discovery. No bootstrap servers, no internet — pure LAN.
func NewNode(ctx context.Context) (*Node, error) {
	h, err := libp2p.New() // listens on ephemeral TCP/QUIC addresses
	if err != nil {
		return nil, err
	}
	n := &Node{host: h, router: NewRouter(), ctx: ctx}
	h.SetStreamHandler(protocolID, n.handleStream)

	svc := mdns.NewMdnsService(h, serviceTag, n)
	if err := svc.Start(); err != nil {
		return nil, fmt.Errorf("start mDNS: %w", err)
	}
	return n, nil
}

func (n *Node) OnMessage(fn func(m DistressMessage, isRelay bool)) { n.onMessage = fn }
func (n *Node) ID() string                                        { return n.host.ID().String() }

// HandlePeerFound is the mDNS callback fired for every peer discovered on the
// local network. We dial it and then replay our retained history — so a device
// that just powered on immediately receives the standing distress calls
// (store-and-forward / delay-tolerant behaviour), not only messages sent after
// it joined.
func (n *Node) HandlePeerFound(pi peer.AddrInfo) {
	if pi.ID == n.host.ID() {
		return
	}
	go func() {
		if err := n.host.Connect(n.ctx, pi); err != nil {
			return // peer may vanish; mDNS will re-announce it later
		}
		log.Printf("🔗 peer connected: %s", short(pi.ID.String()))
		for _, m := range n.router.Snapshot() { // CRITICAL first
			n.sendTo(pi.ID, m)
		}
	}()
}

// Publish injects a message this device originated and floods it to all peers.
func (n *Node) Publish(m DistressMessage) {
	n.router.Accept(m) // record our own so we don't reprocess echoes
	n.broadcast(m, "")
}

// handleStream processes one inbound message (one message per stream).
func (n *Node) handleStream(s network.Stream) {
	defer s.Close()
	var m DistressMessage
	if err := json.NewDecoder(s).Decode(&m); err != nil {
		return
	}
	src := s.Conn().RemotePeer()

	isNew, forward, ok := n.router.Accept(m)
	if !isNew {
		return // already seen — drop it, this is the anti-loop guard
	}
	if n.onMessage != nil {
		n.onMessage(m, m.RelayCount > 0)
	}
	if ok {
		// Controlled flooding: relay to every peer except the one we got it from.
		n.broadcast(forward, src)
	}
}

func (n *Node) broadcast(m DistressMessage, exclude peer.ID) {
	for _, p := range n.host.Network().Peers() {
		if p == exclude {
			continue
		}
		n.sendTo(p, m)
	}
}

func (n *Node) sendTo(pid peer.ID, m DistressMessage) {
	s, err := n.host.NewStream(n.ctx, pid, protocolID)
	if err != nil {
		return
	}
	defer s.Close()
	_ = json.NewEncoder(s).Encode(m)
}

func short(id string) string {
	if len(id) <= 12 {
		return id
	}
	return id[:6] + "…" + id[len(id)-4:]
}
