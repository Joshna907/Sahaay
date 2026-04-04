import React, { useState, useEffect, useRef } from 'react';
import { Radio, Send, MapPin, Activity, ShieldAlert, Cpu, Battery, Wifi, Menu, Navigation, AlertTriangle, User, Thermometer, Droplets, Utensils, Stethoscope } from 'lucide-react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- LEAFLET CONFIG ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const tacticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const peerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]); // Moved to top
  const [peers, setPeers] = useState([]);       // Moved to top
  const [msgPriority, setMsgPriority] = useState('low'); // Default to LOW
  const [msgTags, setMsgTags] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [cpuLoad, setCpuLoad] = useState(12);
  const [systemTemp, setSystemTemp] = useState(38); // Live Temp
  const [threatCount, setThreatCount] = useState(0); // Live Threats

  const messagesEndRef = useRef(null);

  // --- LIVE SYSTEM MONITORING ---
  useEffect(() => {
    // 1. Real Battery
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // 2. Simulated/Live Metrics (CPU & Temp Jitter)
    const statsInterval = setInterval(() => {
      // CPU: Random float between 5% and 15%
      setCpuLoad(prev => Math.max(5, Math.min(100, (parseFloat(prev) + (Math.random() * 6 - 3)).toFixed(1))));

      // Temp: Random float between 35°C and 45°C
      setSystemTemp(prev => Math.max(35, Math.min(60, (parseFloat(prev) + (Math.random() * 2 - 1)).toFixed(1))));
    }, 2000);

    return () => clearInterval(statsInterval);
  }, []);

  // 3. Threat Counter (Derived from Messages)
  useEffect(() => {
    const threats = messages.filter(m => m.type === 'critical' || m.type === 'high').length;
    setThreatCount(threats);
  }, [messages]);

  // Track messages sent by this device
  const getMyIds = () => {
    try { return new Set(JSON.parse(localStorage.getItem('my_sent_ids') || '[]')); }
    catch { return new Set(); }
  };
  const [myIds, setMyIds] = useState(getMyIds());

  // POLL BACKEND FOR PEERS & MESSAGES
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Peers
        const peerQuery = `
          query {
            activeNodes {
              id
              deviceId
              isOnline
              location {
                latitude
                longitude
              }
            }
          }
        `;
        const peerRes = await fetch(import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8080/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: peerQuery }),
        });
        const peerResult = await peerRes.json();
        if (peerResult.data && peerResult.data.activeNodes) {
          const mappedPeers = peerResult.data.activeNodes.map(node => ({
            id: node.id,
            name: node.deviceId.substring(0, 8),
            pos: [node.location ? node.location.latitude : 500, node.location ? node.location.longitude : 500],
            status: node.isOnline ? "online" : "offline"
          }));
          setPeers(mappedPeers);
        }

        // Fetch Messages
        const msgQuery = `
          query {
            distressMessages {
              id
              sender {
                name
                deviceId
              }
              content
              messageType
              urgencyLevel
              createdAt
            }
          }
        `;
        const msgRes = await fetch(import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8080/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: msgQuery }),
        });
        const msgResult = await msgRes.json();
        if (msgResult.data && msgResult.data.distressMessages) {
          const currentMyIds = getMyIds();
          const mappedMessages = msgResult.data.distressMessages.map(m => {
            const isMe = currentMyIds.has(m.id);
            return {
              id: m.id,
              sender: isMe ? "Me" : (m.sender ? m.sender.name : 'Unknown'),
              time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: m.content,
              type: m.urgencyLevel === 'CRITICAL' ? 'critical' : 'normal',
              tags: m.messageType === 'GENERAL' ? [] : [m.messageType.toLowerCase()],
              self: isMe
            };
          });

          setMessages(mappedMessages);
        }

      } catch (error) {
        console.error("Backend polling failed:", error);
      }
    };

    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Monitor System Stats (Battery + Fake CPU Fluctuation)
  useEffect(() => {
    // Battery
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // CPU Fluctuation Simulation (Vitality)
    const interval = setInterval(() => {
      setCpuLoad(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newVal = prev + change;
        return newVal > 100 ? 99 : newVal < 5 ? 5 : newVal;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, activeTab]);

  const toggleTag = (tagId) => {
    console.log("Toggling tag:", tagId);
    setMsgTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // 1. Optimistic UI Update (Optional, removed for now to simplify sync with backend)
    // const optimisticMsg = {
    //   id: "temp-" + Date.now(),
    //   sender: 'Me',
    //   time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    //   content: inputText,
    //   self: true,
    //   type: msgPriority,
    //   tags: [...msgTags]
    // };
    // setMessages(prev => [...prev, optimisticMsg]);

    try {
      // 2. Send to Backend
      const mutation = `
        mutation {
          createDistressMessage(input: {
            messageType: ${msgTags.length > 0 ? msgTags[0].toUpperCase() : 'GENERAL'},
            urgencyLevel: ${msgPriority.toUpperCase()},
            content: "${inputText}",
            location: {
              latitude: 500.0,
              longitude: 500.0
            }
          }) {
            id
            status
          }
        }
      `;

      console.log("Sending mutation...", mutation);
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8080/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation }),
      });

      const result = await res.json();
      if (result.errors) {
        console.error("GraphQL Errors:", result.errors);
        alert("BACKEND ERROR: " + result.errors[0].message);
      } else {
        console.log("Message sent successfully:", result.data);
        if (result.data.createDistressMessage && result.data.createDistressMessage.id) {
          const newId = result.data.createDistressMessage.id;
          const currentIds = getMyIds();
          currentIds.add(newId);
          localStorage.setItem('my_sent_ids', JSON.stringify([...currentIds]));
          setMyIds(currentIds); // Trigger re-render check next poll
        }
      }

    } catch (err) {
      console.error("Failed to send message:", err);
      alert("SEND FAILED: " + err.message);
    }

    setInputText('');
    setMsgPriority('low');
    setMsgTags([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex h-screen w-screen bg-tactical-bg text-text-primary overflow-hidden font-sans selection:bg-neon-blue/30">

      {/* SIDEBAR */}
      <div className="w-20 bg-tactical-card/90 backdrop-blur-xl border-r border-tactical-border flex flex-col items-center py-6 space-y-8 z-50">
        <div className="p-3 bg-neon-orange/10 border border-neon-orange/20 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Radio className="w-8 h-8 text-neon-orange animate-pulse" />
        </div>

        <div className="flex flex-col space-y-6 w-full items-center">
          {/* Nav Items manually inlined for safety */}
          <button
            onClick={() => { console.log("Clicked Chat"); setActiveTab('chat'); }}
            className={cn("p-3.5 rounded-2xl transition-all duration-200 relative", activeTab === 'chat' ? "bg-neon-blue text-white scale-110 shadow-lg shadow-neon-blue/40" : "text-text-secondary hover:bg-white/10")}
          >
            <ShieldAlert />
          </button>

          {/*           <button
            onClick={() => { console.log("Clicked Map"); setActiveTab('map'); }}
            className={cn("p-3.5 rounded-2xl transition-all duration-200 relative", activeTab === 'map' ? "bg-neon-blue text-white scale-110 shadow-lg shadow-neon-blue/40" : "text-text-secondary hover:bg-white/10")}
          >
            <MapPin />
          </button> */}

          <button
            onClick={() => setActiveTab('status')}
            className={cn("p-3.5 rounded-2xl transition-all duration-200 relative", activeTab === 'status' ? "bg-neon-blue text-white scale-110 shadow-lg shadow-neon-blue/40" : "text-text-secondary hover:bg-white/10")}
          >
            <Activity />
          </button>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex flex-col items-center group cursor-pointer">
            <span className="text-[10px] font-mono text-neon-green group-hover:text-white transition-colors">SAHAAY-OS</span>
            <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_#10B981] mt-1"></div>
          </div>
          <div className="w-8 h-[1px] bg-tactical-border"></div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn("p-3.5 rounded-2xl transition-all duration-300 relative group", showMenu ? "bg-white/10 text-white" : "text-text-secondary hover:text-white hover:bg-white/5")}
          >
            <Menu />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-tactical-bg relative z-10">

        {/* Header */}
        <header className="h-16 border-b border-tactical-border flex items-center justify-between px-6 bg-tactical-card/60 backdrop-blur-md sticky top-0 z-40">
          <div>
            <h1 className="text-xs font-bold tracking-[0.2em] text-text-secondary uppercase mb-1">
              {activeTab === 'chat' ? 'Sector Broadcast' : activeTab === 'map' ? 'Tactical Map' : 'System Overview'}
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-white tracking-tight">General Frequency</span>
              <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-neon-blue">#CH-01</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/20 rounded-full">
              <Cpu className="w-4 h-4 text-neon-green" />
              <span className="text-xs font-mono text-neon-green">MESH: STABLE</span>
            </div>
          </div>
        </header>

        {/* CHAT VIEW */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-thin scrollbar-thumb-tactical-border scrollbar-track-transparent">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.self ? "items-end" : "items-start")}>
                  <div className="flex items-center space-x-2 mb-1 px-1 opacity-70">
                    <span className={cn("text-[10px] font-bold uppercase", msg.self ? "text-neon-blue" : "text-neon-orange")}>{msg.sender}</span>
                    <span className="text-[9px] font-mono text-text-secondary">{msg.time}</span>
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-xl text-sm border backdrop-blur-sm shadow-sm transition-all hover:shadow-md",
                    msg.type === 'critical'
                      ? "bg-neon-red/10 border-neon-red text-white shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                      : msg.self
                        ? "bg-neon-blue/10 border-neon-blue/30 text-gray-100 rounded-tr-sm"
                        : "bg-tactical-card border-tactical-border text-gray-300 rounded-tl-sm"
                  )}>
                    {msg.type === 'critical' && (
                      <div className="flex items-center space-x-2 text-neon-red mb-2 pb-2 border-b border-neon-red/20">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Priority Alert</span>
                      </div>
                    )}
                    {msg.tags && msg.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {msg.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[9px] font-mono border border-white/10 text-neon-orange shadow-sm capitalize">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="p-4 bg-tactical-card/80 backdrop-blur-xl border-t border-tactical-border z-50 pb-6">
              <div className="flex items-center space-x-4 mb-4 overflow-x-auto no-scrollbar py-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mr-2">Priority:</span>

                <button
                  onClick={() => setMsgPriority('low')}
                  className={cn(
                    "px-3 py-1 rounded text-[10px] font-bold font-mono tracking-wider transition-all border",
                    msgPriority === 'low'
                      ? cn("text-neon-green border-neon-green", "bg-white/5 shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-105")
                      : "text-text-secondary border-transparent hover:bg-white/5 opacity-60 hover:opacity-100"
                  )}
                >
                  LOW
                </button>

                <button
                  onClick={() => setMsgPriority('critical')}
                  className={cn(
                    "px-3 py-1 rounded text-[10px] font-bold font-mono tracking-wider transition-all border",
                    msgPriority === 'critical'
                      ? cn("text-neon-red border-neon-red shadow-neon-red/20", "bg-white/5 shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-105")
                      : "text-text-secondary border-transparent hover:bg-white/5 opacity-60 hover:opacity-100"
                  )}
                >
                  CRITICAL
                </button>

                <div className="w-[1px] h-4 bg-tactical-border mx-2"></div>

                <button
                  onClick={() => toggleTag('food')}
                  className={cn(
                    "px-3 py-1 rounded border text-xs font-medium flex items-center space-x-1.5 transition-all select-none",
                    msgTags.includes('food')
                      ? "border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                      : "border-tactical-border text-text-secondary hover:border-text-secondary hover:bg-white/5"
                  )}
                >
                  <Utensils className="w-3 h-3" /> <span>Food</span>
                  {msgTags.includes('food') && <div className="w-1.5 h-1.5 rounded-full bg-neon-blue ml-1 animate-pulse" />}
                </button>

                <button
                  onClick={() => toggleTag('water')}
                  className={cn(
                    "px-3 py-1 rounded border text-xs font-medium flex items-center space-x-1.5 transition-all select-none",
                    msgTags.includes('water')
                      ? "border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                      : "border-tactical-border text-text-secondary hover:border-text-secondary hover:bg-white/5"
                  )}
                >
                  <Droplets className="w-3 h-3" /> <span>Water</span>
                  {msgTags.includes('water') && <div className="w-1.5 h-1.5 rounded-full bg-neon-blue ml-1 animate-pulse" />}
                </button>

                <button
                  onClick={() => toggleTag('medical')}
                  className={cn(
                    "px-3 py-1 rounded border text-xs font-medium flex items-center space-x-1.5 transition-all select-none",
                    msgTags.includes('medical')
                      ? "border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                      : "border-tactical-border text-text-secondary hover:border-text-secondary hover:bg-white/5"
                  )}
                >
                  <Stethoscope className="w-3 h-3" /> <span>Medical</span>
                  {msgTags.includes('medical') && <div className="w-1.5 h-1.5 rounded-full bg-neon-blue ml-1 animate-pulse" />}
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-neon-blue/20 blur-md rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={`Broadcast ${msgPriority} message...`}
                    className={cn(
                      "relative w-full bg-black/40 border rounded-lg px-4 py-3 text-white placeholder-text-secondary outline-none transition-all font-mono text-sm",
                      msgPriority === 'critical' ? "border-neon-red/50 focus:border-neon-red" : "border-tactical-border focus:border-neon-blue/50"
                    )}
                  />
                </div>
                <button
                  onClick={handleSend}
                  className={cn(
                    "p-3 text-white rounded-lg active:scale-95 transition-all shadow-lg",
                    msgPriority === 'critical' ? "bg-neon-red shadow-neon-red/20 hover:bg-neon-red/80" : "bg-neon-blue shadow-neon-blue/20 hover:bg-neon-blue/80"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* MAP VIEW */}
        {activeTab === 'map' && (
          <div className="flex-1 relative bg-[#0F1115] z-0">
            <MapContainer
              center={[500, 500]}
              zoom={0}
              minZoom={-2}
              maxZoom={2}
              crs={L.CRS.Simple}
              className="w-full h-full"
              zoomControl={false}
            >
              <ImageOverlay
                url="https://w.wallhaven.cc/full/2e/wallhaven-2e99xg.jpg"
                bounds={[[0, 0], [1000, 1000]]}
              />
              <Marker position={[500, 500]} icon={tacticalIcon}>
                <Popup className="tactical-popup">
                  <div className="font-mono text-xs"><strong>HQ NODE</strong><br /><span className="text-neon-blue">ONLINE</span></div>
                </Popup>
              </Marker>
              {peers.map(peer => (
                <Marker key={peer.id} position={peer.pos} icon={peerIcon}>
                  <Popup className="tactical-popup">
                    <div className="font-mono text-xs"><strong>{peer.name}</strong><br /><span className="text-neon-green">SIGNAL: STRONG</span></div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="absolute top-4 left-4 z-[400] bg-black/80 backdrop-blur border border-tactical-border p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green animate-pulse rounded-full"></div>
                <span className="text-xs font-mono font-bold text-white">LIVE TRACKING</span>
              </div>
              <div className="mt-2 text-[10px] text-text-secondary font-mono">
                NODES: {peers.length}<br />
                LAT: 500.00 / LON: 500.00
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: STATUS --- */}
        {activeTab === 'status' && (
          <div className="flex-1 p-6 bg-tactical-bg relative z-10">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#30363D 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>
            <div className="relative z-20 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Activity className="w-5 h-5 text-neon-blue" /> System Overview
                </h2>
                <span className="text-sm font-mono text-neon-green bg-neon-green/10 px-3 py-1 rounded-full border border-neon-green/20">OPTIMAL</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-text-secondary uppercase font-bold">Nodes</div>
                    <Wifi className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">{peers.length}</div>
                  <div className="text-xs text-text-secondary mt-1">Detected & Online</div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-text-secondary uppercase font-bold">Power</div>
                    <Battery className="w-5 h-5 text-neon-green" />
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">{batteryLevel}%</div>
                  <div className="text-xs text-text-secondary mt-1">Stable Output</div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-text-secondary uppercase font-bold">GPS</div>
                    <Navigation className="w-5 h-5 text-neon-orange" />
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">Fix</div>
                  <div className="text-xs text-text-secondary mt-1">Accuracy: &lt;1m</div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-text-secondary uppercase font-bold">Threats</div>
                    <ShieldAlert className={cn("w-5 h-5", threatCount > 0 ? "text-neon-red animate-pulse" : "text-gray-500")} />
                  </div>
                  <div className={cn("text-3xl font-mono font-bold", threatCount > 0 ? "text-neon-red" : "text-white")}>{threatCount}</div>
                  <div className="text-xs text-text-secondary mt-1">{threatCount > 0 ? "Active Alerts" : "No Active Threats"}</div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-text-secondary uppercase font-bold">CPU Load</div>
                    <Cpu className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">{parseInt(cpuLoad)}%</div>
                  <div className="text-xs text-text-secondary mt-1">Average</div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-text-secondary uppercase font-bold">Temperature</div>
                    <Thermometer className={cn("w-5 h-5", systemTemp > 50 ? "text-neon-red" : "text-neon-blue")} />
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">{parseInt(systemTemp)}°C</div>
                  <div className="text-xs text-text-secondary mt-1">System Average</div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-white tracking-wide mb-4">Connected Peers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {peers.map(peer => (
                    <div key={peer.id} className="bg-black/20 p-4 rounded-lg border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="flex items-center space-x-3">
                        <User className="w-6 h-6 text-neon-orange" />
                        <div>
                          <div className="text-sm font-bold text-white">{peer.name}</div>
                          <div className="text-xs text-text-secondary font-mono">ID: {peer.id}</div>
                        </div>
                      </div>
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                        peer.status === 'online' ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                      )}>
                        {peer.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* COMMAND MENU OVERLAY */}
      {showMenu && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-[400px] bg-tactical-card border border-tactical-border rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowMenu(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Menu className="w-5 h-5 text-neon-blue" /> SYSTEM MENU
            </h2>

            <div className="space-y-3">
              <div
                onClick={() => alert("Re-calibrating Mesh Interfaces... OPTIMAL.")}
                className="p-4 bg-black/40 rounded-lg border border-white/5 hover:border-neon-blue/50 cursor-pointer transition-colors group"
              >
                <div className="text-sm font-bold text-white group-hover:text-neon-blue">Network Config</div>
                <div className="text-xs text-text-secondary">Manage Mesh interfaces</div>
              </div>
              <div
                onClick={() => { fetchData(); alert("Forcing Synced with Backend..."); }}
                className="p-4 bg-black/40 rounded-lg border border-white/5 hover:border-neon-blue/50 cursor-pointer transition-colors group"
              >
                <div className="text-sm font-bold text-white group-hover:text-neon-blue">Data Sync</div>
                <div className="text-xs text-text-secondary">Force sync with nearby peers</div>
              </div>
              <div
                onClick={() => window.close()}
                className="p-4 bg-black/40 rounded-lg border border-white/5 hover:border-neon-red/50 cursor-pointer transition-colors group"
              >
                <div className="text-sm font-bold text-white group-hover:text-neon-red">System Shutdown</div>
                <div className="text-xs text-text-secondary">Terminate Sahaay Engine</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <div className="text-[10px] font-mono text-text-secondary">SAHAAY DESKTOP v0.1.0</div>
              <div className="text-[10px] font-mono text-text-secondary">BUILD: ALPHA-RC1</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
