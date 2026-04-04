package model

type User struct {
	ID       string    `bson:"_id,omitempty" json:"id"`
	Name     string    `bson:"name" json:"name"`
	Email    string    `bson:"email" json:"email"`
	Phone    *string   `bson:"phone,omitempty" json:"phone"`
	Location *Location `bson:"location,omitempty" json:"location"`
	IsActive bool      `bson:"is_active" json:"isActive"`
	LastSeen *string   `bson:"last_seen,omitempty" json:"lastSeen"` // Using string for GraphQL compatibility
	DeviceID string    `bson:"device_id" json:"deviceId"`
}
