// Command meshnode runs a single Sahaay mesh node from the terminal.
//
// Open two terminals on the same LAN (or the same machine) and run:
//
//	go run ./cmd/meshnode -name alice -send
//	go run ./cmd/meshnode -name bob
//
// They discover each other over mDNS with no server, and alice's distress
// messages appear on bob (and would relay onward to any further hop).
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"sahaay-backend/mesh"
)

func main() {
	name := flag.String("name", "node", "human-readable label for this node")
	send := flag.Bool("send", false, "periodically broadcast a demo distress message")
	interval := flag.Duration("interval", 8*time.Second, "how often to broadcast when -send is set")
	flag.Parse()

	log.SetFlags(log.Ltime)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	node, err := mesh.NewNode(ctx)
	if err != nil {
		log.Fatalf("failed to start node: %v", err)
	}
	log.Printf("🛰️  %s online — peer %s", *name, node.ID())
	log.Printf("    discovering peers on the local network (mDNS)…")

	node.OnMessage(func(m mesh.DistressMessage, isRelay bool) {
		tag := "direct"
		if isRelay {
			tag = fmt.Sprintf("relayed %d hop(s)", m.RelayCount)
		}
		log.Printf("📩 [%s] %s: %q  (from %s, %s)",
			m.Urgency, m.Type, m.Content, short(m.Origin), tag)
	})

	if *send {
		go broadcastLoop(ctx, node, node.ID(), *interval)
	}

	// Block until Ctrl-C.
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	<-sig
	log.Printf("shutting down %s", *name)
}

func broadcastLoop(ctx context.Context, node *mesh.Node, origin string, every time.Duration) {
	samples := []struct{ typ, urgency, content string }{
		{"MEDICAL", "CRITICAL", "Diabetic needs insulin, block 7"},
		{"WATER", "HIGH", "Out of drinking water, 4 people"},
		{"FOOD", "MEDIUM", "Need food supplies for shelter"},
		{"RESCUE", "CRITICAL", "Trapped under debris, sending location"},
	}
	i := 0
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s := samples[i%len(samples)]
			m := mesh.NewDistressMessage(origin, s.typ, s.urgency, s.content, 12.9716, 77.5946, time.Now())
			node.Publish(m)
			log.Printf("📤 broadcast [%s] %s: %q", s.urgency, s.typ, s.content)
			i++
		}
	}
}

func short(id string) string {
	if len(id) <= 12 {
		return id
	}
	return id[:6] + "…" + id[len(id)-4:]
}
