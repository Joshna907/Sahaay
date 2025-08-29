// 🚨 SAHAAY DISASTER MANAGEMENT DATABASE SETUP 🚨
// PURPOSE: Creates MongoDB collections and indexes for emergency response system
// WHY NEEDED: Proper database structure is critical for fast emergency lookups during disasters
// WHAT IT CREATES: Collections for users, distress messages, device nodes, and message routing

// Connect to Sahaay database (creates it if doesn't exist)
db = db.getSiblingDB('sahaay');

print('🚨 Setting up Sahaay Disaster Management Database...');

// =============================================================================
// 1. USERS COLLECTION - People in the disaster network
// =============================================================================
print('👥 Creating users collection...');
db.createCollection('users');

// Indexes for fast user lookups during emergencies
db.users.createIndex({ "email": 1 }, { unique: true });           // Unique email login
db.users.createIndex({ "device_id": 1 }, { unique: true });       // Unique device tracking
db.users.createIndex({ "location.latitude": 1, "location.longitude": 1 }); // Geographic queries
db.users.createIndex({ "is_active": 1 });                         // Find active rescuers
db.users.createIndex({ "last_seen": 1 });                         // Recently online users

print('✅ Users collection ready with geographic and device indexes');

// =============================================================================
// 2. DISTRESS_MESSAGES COLLECTION - Emergency requests (MOST CRITICAL)
// =============================================================================
print('🆘 Creating distress_messages collection...');
db.createCollection('distress_messages');

// Critical indexes for emergency response speed
db.distress_messages.createIndex({ "location.latitude": 1, "location.longitude": 1 }); // Geographic emergency search
db.distress_messages.createIndex({ "urgency_level": 1 });         // Find CRITICAL emergencies first
db.distress_messages.createIndex({ "message_type": 1 });          // Filter by FOOD/WATER/MEDICAL etc.
db.distress_messages.createIndex({ "status": 1 });                // Find PENDING vs ACKNOWLEDGED
db.distress_messages.createIndex({ "created_at": 1 });            // Recent emergencies first
db.distress_messages.createIndex({ "expires_at": 1 });            // Remove expired requests
db.distress_messages.createIndex({ "sender_id": 1 });             // Track user's emergency history
db.distress_messages.createIndex({ 
    "location.latitude": 1, 
    "location.longitude": 1, 
    "urgency_level": 1,
    "status": 1 
}, { name: "emergency_response_index" }); // Compound index for fastest emergency queries

print('✅ Distress messages collection ready with emergency response indexes');

// =============================================================================
// 3. DEVICE_NODES COLLECTION - Mesh network devices
// =============================================================================
print('📱 Creating device_nodes collection...');
db.createCollection('device_nodes');

// Indexes for mesh network topology and device discovery
db.device_nodes.createIndex({ "device_id": 1 }, { unique: true }); // Unique device identification
db.device_nodes.createIndex({ "user_id": 1 });                     // Link devices to users
db.device_nodes.createIndex({ "is_online": 1 });                   // Find active network nodes
db.device_nodes.createIndex({ "last_seen": 1 });                   // Recently active devices
db.device_nodes.createIndex({ "location.latitude": 1, "location.longitude": 1 }); // Geographic device mesh
db.device_nodes.createIndex({ "connected_peers": 1 });             // Mesh network connections

print('✅ Device nodes collection ready with mesh network indexes');

// =============================================================================
// 4. MESSAGE_ROUTES COLLECTION - Track message propagation through mesh network
// =============================================================================
print('🔄 Creating message_routes collection...');
db.createCollection('message_routes');

// Indexes for tracking how emergency messages spread through the network
db.message_routes.createIndex({ "message_id": 1 });                // All routes for specific message
db.message_routes.createIndex({ "from_device_id": 1 });            // Messages sent from device
db.message_routes.createIndex({ "to_device_id": 1 });              // Messages received by device
db.message_routes.createIndex({ "timestamp": 1 });                 // Chronological message flow
db.message_routes.createIndex({ "hop_count": 1 });                 // Network efficiency analysis

print('✅ Message routes collection ready with propagation tracking');

// =============================================================================
// 5. CREATE SAMPLE EMERGENCY DATA FOR TESTING
// =============================================================================
print('🧪 Creating sample emergency data for testing...');

// Sample emergency user
db.users.insertOne({
    _id: "test-user-001",
    name: "Emergency Test User",
    email: "emergency@test.com",
    phone: "+1-555-HELP",
    device_id: "device-001",
    is_active: true,
    location: {
        latitude: 40.7589,
        longitude: -73.9851,
        address: "Times Square, New York, NY"
    },
    last_seen: new Date()
});

// Sample critical medical emergency
db.distress_messages.insertOne({
    _id: "emergency-001",
    sender_id: "test-user-001", 
    message_type: "MEDICAL",
    urgency_level: "CRITICAL",
    content: "Diabetic emergency - need insulin urgently! Person unconscious!",
    location: {
        latitude: 40.7589,
        longitude: -73.9851,
        address: "Times Square, New York, NY"
    },
    status: "PENDING",
    created_at: new Date(),
    expires_at: new Date(Date.now() + 6*60*60*1000), // Expires in 6 hours
    relay_count: 0,
    acknowledgments: []
});

// Sample device node
db.device_nodes.insertOne({
    _id: "node-001",
    device_id: "device-001",
    user_id: "test-user-001",
    location: {
        latitude: 40.7589,
        longitude: -73.9851,
        address: "Times Square, New York, NY"
    },
    is_online: true,
    last_seen: new Date(),
    connected_peers: [],
    message_queue_size: 1
});

print('✅ Sample emergency data created for testing');

// =============================================================================
// 6. DATABASE STATISTICS AND VERIFICATION
// =============================================================================
print('\n📊 SAHAAY DATABASE SETUP COMPLETE!');
print('=====================================');
print('Database: ' + db.getName());
print('Collections created:');
db.getCollectionNames().forEach(function(collection) {
    var indexes = db[collection].getIndexes().length;
    print('  📁 ' + collection + ': ready with ' + indexes + ' indexes');
});

print('\n🚨 EMERGENCY SYSTEM READY FOR TESTING!');
print('Next steps:');
print('1. Start your Sahaay backend: go run server.go');
print('2. Open GraphQL playground: http://localhost:8080');
print('3. Test emergency creation and retrieval');
print('=====================================\n');
