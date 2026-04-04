package model

import (
	"time"
)

// MessageType represents the type of distress message
type MessageType string

const (
	MessageTypeFood    MessageType = "FOOD"
	MessageTypeWater   MessageType = "WATER"
	MessageTypeShelter MessageType = "SHELTER"
	MessageTypeMedical MessageType = "MEDICAL"
	MessageTypeRescue  MessageType = "RESCUE"
	MessageTypeGeneral MessageType = "GENERAL"
)

// MessageStatus represents the current status of a message
type MessageStatus string

const (
	MessageStatusPending      MessageStatus = "PENDING"
	MessageStatusDelivered    MessageStatus = "DELIVERED"
	MessageStatusAcknowledged MessageStatus = "ACKNOWLEDGED"
	MessageStatusExpired      MessageStatus = "EXPIRED"
)

// UrgencyLevel represents the urgency of a distress message
type UrgencyLevel string

const (
	UrgencyLevelLow      UrgencyLevel = "LOW"
	UrgencyLevelMedium   UrgencyLevel = "MEDIUM"
	UrgencyLevelHigh     UrgencyLevel = "HIGH"
	UrgencyLevelCritical UrgencyLevel = "CRITICAL"
)

// Location represents geographical coordinates
type Location struct {
	Latitude  float64 `bson:"latitude" json:"latitude"`
	Longitude float64 `bson:"longitude" json:"longitude"`
	Address   *string `bson:"address,omitempty" json:"address"`
}

// DistressMessage represents a distress message in the system
type DistressMessage struct {
	ID              string        `bson:"_id,omitempty" json:"id"`
	SenderID        string        `bson:"sender_id" json:"senderId"`
	MessageType     MessageType   `bson:"message_type" json:"messageType"`
	UrgencyLevel    UrgencyLevel  `bson:"urgency_level" json:"urgencyLevel"`
	Content         string        `bson:"content" json:"content"`
	Location        Location      `bson:"location" json:"location"`
	Status          MessageStatus `bson:"status" json:"status"`
	CreatedAt       time.Time     `bson:"created_at" json:"createdAt"`
	ExpiresAt       *time.Time    `bson:"expires_at,omitempty" json:"expiresAt"`
	RelayCount      int           `bson:"relay_count" json:"relayCount"`
	Acknowledgments []string      `bson:"acknowledgments" json:"acknowledgments"`
}

// DeviceNode represents a device in the network
type DeviceNode struct {
	ID               string    `bson:"_id,omitempty" json:"id"`
	DeviceID         string    `bson:"device_id" json:"deviceId"`
	UserID           *string   `bson:"user_id,omitempty" json:"userId"`
	Location         *Location `bson:"location,omitempty" json:"location"`
	IsOnline         bool      `bson:"is_online" json:"isOnline"`
	LastSeen         time.Time `bson:"last_seen" json:"lastSeen"`
	ConnectedPeers   []string  `bson:"connected_peers" json:"connectedPeers"`
	MessageQueueSize int       `bson:"message_queue_size" json:"messageQueueSize"`
}

// MessageRoute represents the path a message takes through the network
type MessageRoute struct {
	ID           string    `bson:"_id,omitempty" json:"id"`
	MessageID    string    `bson:"message_id" json:"messageId"`
	FromDeviceID string    `bson:"from_device_id" json:"fromDeviceId"`
	ToDeviceID   string    `bson:"to_device_id" json:"toDeviceId"`
	Timestamp    time.Time `bson:"timestamp" json:"timestamp"`
	HopCount     int       `bson:"hop_count" json:"hopCount"`
}

// Input types for GraphQL mutations
type LocationInput struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   *string `json:"address"`
}

type CreateDistressMessageInput struct {
	MessageType  MessageType   `json:"messageType"`
	UrgencyLevel UrgencyLevel  `json:"urgencyLevel"`
	Content      string        `json:"content"`
	Location     LocationInput `json:"location"`
	ExpiresIn    *int          `json:"expiresIn"` // hours
}

type CreateUserInput struct {
	Name     string         `json:"name"`
	Email    string         `json:"email"`
	Phone    *string        `json:"phone"`
	Location *LocationInput `json:"location"`
	DeviceID string         `json:"deviceId"`
}
