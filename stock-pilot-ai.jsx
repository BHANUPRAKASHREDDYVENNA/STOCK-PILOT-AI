import { useState, useEffect, useRef } from "react";

const INITIAL_INVENTORY = [
  { id: 1, name: "Tata Salt 1kg", category: "Staples", stock: 45, minStock: 20, unit: "pkt", price: 22 },
  { id: 2, name: "Amul Butter 500g", category: "Dairy", stock: 8, minStock: 15, unit: "pcs", price: 285 },
  { id: 3, name: "Maggi Noodles 70g", category: "Instant Food", stock: 3, minStock: 30, unit: "pkt", price: 14 },
  { id: 4, name: "Toor Dal 1kg", category: "Staples", stock: 60, minStock: 25, unit: "kg", price: 140 },
  { id: 5, name: "Surf Excel 1kg", category: "Household", stock: 12, minStock: 10, unit: "pkt", price: 220 },
  { id: 6, name: "Parle-G Biscuits", category: "Snacks", stock: 2, minStock: 40, unit: "pkt", price: 10 },
  { id: 7, name: "Colgate 200g", category: "Personal Care", stock: 18, minStock: 10, unit: "pcs", price: 110 },
  { id: 8, name: "Sunflower Oil 1L", category: "Cooking Oil", stock: 22, minStock: 15, unit: "btl", price: 160 },
];

const WHOLESALERS = [
  { id: 1, name: "Ravi Wholesale Mart", area: "Mangalagiri", rating: 4.8, deliveryTime: "Same day", phone: "98765-43210" },
  { id: 2, name: "Sri Balaji Traders", area: "Guntur", rating: 4.5, deliveryTime: "Next day", phone: "91234-56789" },
  { id: 3, name: "Metro Cash & Carry", area: "Vijayawada", rating: 4.9, deliveryTime: "2 hours", phone: "95678-12345" },
];

function callClaude(messages, systemPrompt) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  })
    .then((r) => r.json())
    .then((d) => d.content?.map((c) => c.text || "").join("") || "");
}

function CameraScanner({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, [facingMode]);

  async function startCamera(mode) {
    stopCamera();
    setReady(false);
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setReady(true);
        };
      }
    } catch {
      setCamError("Camera access denied. Please allow camera permission in your browser settings.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
    stopCamera();
    onCapture(base64);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(0,0,0,0.75)" }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>📷 Scan Bill / Stock</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setFacingMode(f => f === "environment" ? "user" : "environment")}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12 }}>
            ⟳ Flip
          </button>
          <button onClick={() => { stopCamera(); onClose(); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12 }}>
            ✕ Close
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {camError ? (
          <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📵</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{camError}</div>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "78%", maxWidth: 340, aspectRatio: "3/2", position: "relative" }}>
                {[{s:"top:0;left:0",bw:"3px 0 0 3px"},{s:"top:0;right:0",bw:"3px 3px 0 0"},{s:"bottom:0;left:0",bw:"0 0 3px 3px"},{s:"bottom:0;right:0",bw:"0 3px 3px 0"}].map((c,i)=>(
                  <div key={i} style={{position:"absolute",width:26,height:26,borderColor:"#FF9933",borderStyle:"solid",borderWidth:c.bw,borderRadius:2,...Object.fromEntries(c.s.split(";").map(p=>p.split(":")))}} />
                ))}
                <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(255,153,51,0.2)", borderRadius: 4 }} />
              </div>
            </div>
            {!ready && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 14 }}>Starting camera...</span>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: "1rem 1.5rem 2rem", background: "rgba(0,0,0,0.75)", textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginBottom: 18 }}>
          Point at a bill, invoice, or product shelf — AI reads everything
        </div>
        <button onClick={capture} disabled={!ready}
          style={{ width: 70, height: 70, borderRadius: "50%", background: ready ? "#FF9933" : "#555", border: "4px solid rgba(255,255,255,0.25)", cursor: ready ? "pointer" : "not-allowed", fontSize: 26, transition: "transform 0.1s, opacity 0.15s", opacity: ready ? 1 : 0.5 }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
          📸
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default function StockPilotAI() {
  const [view, setView] = useState("dashboard");
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", content: "Namaste! I'm your Stock Pilot AI assistant. Ask me anything about your inventory — which items are running low, what to reorder, or how to manage your stock better. I can also help you analyse trends!" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [scanMode, setScanMode] = useState("camera");
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const lowStock = inventory.filter((i) => i.stock < i.minStock);
  const totalValue = inventory.reduce((s, i) => s + i.stock * i.price, 0);
  const healthyItems = inventory.filter((i) => i.stock >= i.minStock).length;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  function showNotif(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  async function processImage(base64) {
    setShowCamera(false);
    setCapturedImage(base64);
    setScanLoading(true);
    setScanResult(null);

    const systemPrompt = `You are a bill and stock scanner for an Indian kirana store.
Look at this image carefully. It may be a handwritten bill, printed invoice, or a product shelf.
Extract all visible product names and quantities.
Determine if each item is being sold (outgoing stock) or purchased/restocked (incoming stock).
If it's a shelf/products image, list visible products as "purchased" with estimated count.
Known inventory items: ${inventory.map(i => i.name).join(", ")}
Match to known items where possible. Respond ONLY with a valid JSON array:
[{"name": "item name", "quantity": number, "action": "sold" or "purchased"}]
No markdown, no explanation, just the raw JSON array.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
              { type: "text", text: "Read this image and extract all product names and quantities as a JSON array." }
            ]
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setScanResult(JSON.parse(clean));
    } catch {
      setScanResult([{ name: "Could not read image. Try better lighting or a clearer photo.", quantity: 0, action: "error" }]);
    }
    setScanLoading(false);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImage(ev.target.result.split(",")[1]);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function processBillText() {
    if (!scanInput.trim()) return;
    setScanLoading(true);
    setScanResult(null);
    const systemPrompt = `You are a bill parser for an Indian kirana store.
Parse the bill text and extract items with quantities.
Respond ONLY with a JSON array: [{"name": "item name", "quantity": number, "action": "sold" or "purchased"}]
Known items: ${inventory.map(i => i.name).join(", ")}
No markdown, just the JSON array.`;
    try {
      const reply = await callClaude([{ role: "user", content: `Parse this bill: ${scanInput}` }], systemPrompt);
      const clean = reply.replace(/```json|```/g, "").trim();
      setScanResult(JSON.parse(clean));
    } catch {
      setScanResult([{ name: "Parse error", quantity: 0, action: "error" }]);
    }
    setScanLoading(false);
  }

  function applyBillToInventory() {
    if (!scanResult) return;
    const updated = [...inventory];
    scanResult.forEach((item) => {
      const idx = updated.findIndex(inv =>
        inv.name.toLowerCase().includes(item.name.toLowerCase().split(" ")[0]) ||
        item.name.toLowerCase().includes(inv.name.toLowerCase().split(" ")[0])
      );
      if (idx !== -1 && item.action !== "error") {
        if (item.action === "sold") updated[idx].stock = Math.max(0, updated[idx].stock - item.quantity);
        else updated[idx].stock += item.quantity;
      }
    });
    setInventory(updated);
    setScanInput(""); setScanResult(null); setCapturedImage(null);
    showNotif("✓ Stock updated successfully!");
    setView("dashboard");
  }

  async function sendAiMessage() {
    if (!userInput.trim()) return;
    const userMsg = userInput.trim();
    setUserInput("");
    const updatedMessages = [...aiMessages, { role: "user", content: userMsg }];
    setAiMessages(updatedMessages);
    setAiLoading(true);
    const inventoryContext = inventory.map(i => `${i.name}: ${i.stock} ${i.unit} (min: ${i.minStock}, ₹${i.price})`).join("\n");
    const systemPrompt = `You are Stock Pilot AI, inventory assistant for an Indian kirana store.
Inventory:\n${inventoryContext}
Low stock: ${lowStock.map(i => i.name).join(", ") || "None"}
Total value: ₹${totalValue.toLocaleString("en-IN")}
Be friendly and practical. 2-4 sentences. Respond in Hindi or Telugu if asked in those languages.`;
    try {
      const reply = await callClaude(updatedMessages.slice(1).map(m => ({ role: m.role, content: m.content })), systemPrompt);
      setAiMessages([...updatedMessages, { role: "assistant", content: reply }]);
    } catch {
      setAiMessages([...updatedMessages, { role: "assistant", content: "Sorry, couldn't connect. Please try again." }]);
    }
    setAiLoading(false);
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "inventory", label: "Inventory", icon: "≡" },
    { id: "scan", label: "Scan Bill", icon: "📷" },
    { id: "ai", label: "AI Chat", icon: "◈" },
    { id: "wholesalers", label: "Wholesalers", icon: "⊕" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: "100vh", background: "#F7F6F3", color: "#1A1A18" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
        .nav-btn{background:none;border:none;cursor:pointer;padding:8px 13px;border-radius:8px;font-family:inherit;font-size:13px;color:#888;display:flex;align-items:center;gap:6px;transition:all 0.15s}
        .nav-btn:hover{background:#EDECE8;color:#333}
        .nav-btn.active{background:#1A1A18;color:#fff}
        .card{background:#fff;border-radius:14px;border:0.5px solid #E5E3DC;padding:1.25rem}
        .btn-p{background:#1A1A18;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:opacity 0.15s}
        .btn-p:hover{opacity:0.85}
        .btn-p:disabled{opacity:0.4;cursor:not-allowed}
        .btn-o{background:none;color:#1A1A18;border:0.5px solid #C8C6BE;border-radius:10px;padding:9px 18px;font-family:inherit;font-size:13px;cursor:pointer;transition:all 0.15s}
        .btn-o:hover{background:#F0EFE9}
        .btn-cam{background:#FF9933;color:#fff;border:none;border-radius:10px;padding:11px 22px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:opacity 0.15s;display:flex;align-items:center;gap:8px}
        .btn-cam:hover{opacity:0.88}
        .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:500}
        .tag-r{background:#FEE9E7;color:#C0392B}
        .tag-g{background:#E6F4EA;color:#1E7E34}
        .tag-a{background:#FEF3CD;color:#856404}
        .inp{width:100%;border:0.5px solid #D5D3CB;border-radius:10px;padding:10px 14px;font-family:inherit;font-size:14px;background:#FAFAF7;outline:none;transition:border-color 0.15s}
        .inp:focus{border-color:#1A1A18;background:#fff}
        .cbu{background:#1A1A18;color:#fff;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13.5px;line-height:1.55;max-width:80%;align-self:flex-end}
        .cba{background:#fff;border:0.5px solid #E5E3DC;border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13.5px;line-height:1.55;max-width:85%;align-self:flex-start}
        .sbb{background:#EDECE8;border-radius:100px;height:5px;overflow:hidden}
        .sb{height:100%;border-radius:100px;transition:width 0.4s}
        .rh:hover{background:#FAFAF8}
        .notif{position:fixed;top:1rem;right:1rem;z-index:9999;background:#1A1A18;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:si 0.3s ease}
        @keyframes si{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}
        .pulse{animation:pl 2s infinite}
        @keyframes pl{0%,100%{opacity:1}50%{opacity:0.4}}
        .mtab{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid #D5D3CB;background:#FAFAF7;color:#888;transition:all 0.15s;font-family:inherit}
        .mtab.active{background:#1A1A18;color:#fff;border-color:#1A1A18}
      `}</style>

      {notification && <div className="notif">{notification}</div>}
      {showCamera && <CameraScanner onCapture={processImage} onClose={() => setShowCamera(false)} />}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #E5E3DC", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#1A1A18", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#FF9933", fontSize: 13, fontWeight: 700 }}>SP</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.3px" }}>Stock Pilot AI</span>
        </div>
        <nav style={{ display: "flex", gap: 2 }}>
          {navItems.map((n) => (
            <button key={n.id} className={`nav-btn ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
              <span style={{ fontSize: 12 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.5px", marginBottom: 4 }}>Good morning, Shopkeeper 👋</h1>
              <p style={{ color: "#888", fontSize: 14 }}>Here's your inventory summary for today</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
              {[
                { label: "Total Items", value: inventory.length, sub: "in inventory" },
                { label: "Low Stock", value: lowStock.length, sub: "need reorder", accent: lowStock.length > 0 ? "#C0392B" : "#1E7E34" },
                { label: "Healthy Stock", value: healthyItems, sub: "items", accent: "#1E7E34" },
                { label: "Stock Value", value: `₹${(totalValue / 1000).toFixed(1)}K`, sub: "total worth" },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 600, color: s.accent || "#1A1A18", letterSpacing: "-1px" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            {lowStock.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "3px solid #E74C3C" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>⚠ Low Stock Alerts</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{lowStock.length} items need attention</div>
                  </div>
                  <button className="btn-p" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => setView("wholesalers")}>Order Now</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {lowStock.map((item) => {
                    const pct = Math.round((item.stock / item.minStock) * 100);
                    return (
                      <div key={item.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                          <span style={{ fontSize: 12, color: "#C0392B", fontWeight: 500 }}>{item.stock}/{item.minStock} {item.unit}</span>
                        </div>
                        <div className="sbb"><div className="sb" style={{ width: `${Math.min(100, pct)}%`, background: pct < 30 ? "#E74C3C" : "#F39C12" }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { icon: "📷", title: "Camera Scan", sub: "Point at a bill or shelf", action: () => { setView("scan"); setScanMode("camera"); } },
                { icon: "✏", title: "Type Bill", sub: "Paste bill text manually", action: () => { setView("scan"); setScanMode("text"); } },
                { icon: "◈", title: "Ask AI", sub: "Smart stock recommendations", action: () => setView("ai") },
              ].map((c, i) => (
                <div key={i} className="card" style={{ cursor: "pointer" }} onClick={c.action}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {view === "inventory" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.4px" }}>Inventory</h1>
              <p style={{ color: "#888", fontSize: 13 }}>{inventory.length} products tracked</p>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAF7", borderBottom: "0.5px solid #E5E3DC" }}>
                    {["Product", "Category", "Stock", "Min Stock", "Value", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#999", fontWeight: 500, letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => {
                    const s = item.stock < item.minStock ? "low" : item.stock > item.minStock * 2 ? "excess" : "ok";
                    return (
                      <tr key={item.id} className="rh" style={{ borderBottom: idx < inventory.length - 1 ? "0.5px solid #F0EEE8" : "none" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>{item.category}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "DM Mono,monospace" }}>{item.stock} {item.unit}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#aaa" }}>{item.minStock} {item.unit}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "DM Mono,monospace" }}>₹{(item.stock * item.price).toLocaleString("en-IN")}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`tag ${s === "low" ? "tag-r" : s === "excess" ? "tag-a" : "tag-g"}`}>{s === "low" ? "Low" : s === "excess" ? "Excess" : "Good"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCAN BILL */}
        {view === "scan" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.4px" }}>Scan Bill</h1>
              <p style={{ color: "#888", fontSize: 13 }}>Use your camera or type to update stock instantly</p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
              <button className={`mtab ${scanMode === "camera" ? "active" : ""}`} onClick={() => { setScanMode("camera"); setScanResult(null); setCapturedImage(null); }}>📷 Camera</button>
              <button className={`mtab ${scanMode === "text" ? "active" : ""}`} onClick={() => { setScanMode("text"); setScanResult(null); setCapturedImage(null); }}>✏ Type Bill</button>
            </div>

            {/* CAMERA MODE */}
            {scanMode === "camera" && (
              <div>
                {!capturedImage && !scanLoading && (
                  <div className="card">
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>📷</div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Scan a bill or shelf</div>
                      <div style={{ fontSize: 13, color: "#999", marginBottom: 28, lineHeight: 1.65, maxWidth: 320, margin: "0 auto 28px" }}>
                        Take a live photo of any bill, handwritten receipt, or product shelf — Claude AI will read it and update your stock automatically.
                      </div>
                      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <button className="btn-cam" onClick={() => setShowCamera(true)}>📷 Open Camera</button>
                        <button className="btn-o" onClick={() => fileInputRef.current.click()}>🖼 Upload Photo</button>
                      </div>
                    </div>
                  </div>
                )}

                {scanLoading && (
                  <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
                    {capturedImage && (
                      <img src={`data:image/jpeg;base64,${capturedImage}`} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginBottom: 20 }} />
                    )}
                    <div style={{ fontSize: 32, marginBottom: 10 }} className="pulse">🤖</div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>AI is reading your image...</div>
                    <div style={{ fontSize: 12, color: "#999" }}>Identifying products, quantities, and prices</div>
                  </div>
                )}

                {capturedImage && !scanLoading && !scanResult && (
                  <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}>
                    <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Captured" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#888" }}>Captured image</span>
                      <button className="btn-o" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { setCapturedImage(null); setScanResult(null); }}>Retake</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEXT MODE */}
            {scanMode === "text" && (
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>Type or paste your bill below</div>
                <textarea className="inp" style={{ minHeight: 120, resize: "vertical", marginBottom: 12 }}
                  placeholder='e.g. "Purchased 50 pkts Parle-G, 20 pcs Amul Butter. Sold 5 Maggi."'
                  value={scanInput} onChange={(e) => setScanInput(e.target.value)} />
                <button className="btn-p" onClick={processBillText} disabled={scanLoading || !scanInput.trim()}>
                  {scanLoading ? "Parsing..." : "Parse with AI"}
                </button>
              </div>
            )}

            {/* RESULTS */}
            {scanResult && !scanLoading && (
              <div className="card">
                {capturedImage && (
                  <img src={`data:image/jpeg;base64,${capturedImage}`} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, marginBottom: 14 }} />
                )}
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                  {scanResult.some(i => i.action === "error") ? "⚠ Could not read clearly" : `✓ Found ${scanResult.length} item${scanResult.length !== 1 ? "s" : ""}`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {scanResult.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#FAFAF7", borderRadius: 8, border: "0.5px solid #EDECE8" }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {item.action !== "error" && <span style={{ fontSize: 12, fontFamily: "DM Mono,monospace", color: "#555" }}>×{item.quantity}</span>}
                        <span className={`tag ${item.action === "sold" ? "tag-r" : item.action === "error" ? "tag-a" : "tag-g"}`}>{item.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {!scanResult.every(i => i.action === "error") && (
                    <button className="btn-p" onClick={applyBillToInventory}>Apply to Inventory</button>
                  )}
                  {scanMode === "camera" && (
                    <button className="btn-cam" style={{ fontSize: 12 }} onClick={() => { setScanResult(null); setCapturedImage(null); setShowCamera(true); }}>
                      📷 Scan Again
                    </button>
                  )}
                  <button className="btn-o" onClick={() => { setScanResult(null); setCapturedImage(null); setScanInput(""); }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI CHAT */}
        {view === "ai" && (
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.4px" }}>AI Assistant</h1>
              <p style={{ color: "#888", fontSize: 13 }}>Ask anything. Works in Hindi, Telugu, and English.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 320, maxHeight: 440, overflowY: "auto", padding: "1rem", background: "#FAFAF7", borderRadius: 14, border: "0.5px solid #E5E3DC", marginBottom: 12 }}>
              {aiMessages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "cbu" : "cba"}>{m.content}</div>
              ))}
              {aiLoading && <div className="cba pulse" style={{ color: "#999", fontStyle: "italic" }}>Thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" style={{ flex: 1 }} placeholder="e.g. Which items should I reorder this week?" value={userInput}
                onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAiMessage()} />
              <button className="btn-p" onClick={sendAiMessage} disabled={aiLoading || !userInput.trim()}>Send</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {["Which items are low?", "What to reorder this week?", "Sabse zyada bikne wala item?", "Total stock value?"].map(q => (
                <button key={q} className="btn-o" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => setUserInput(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* WHOLESALERS */}
        {view === "wholesalers" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.4px" }}>Nearby Wholesalers</h1>
              <p style={{ color: "#888", fontSize: 13 }}>Connect and order directly — no middlemen</p>
            </div>
            {lowStock.length > 0 && (
              <div className="card" style={{ marginBottom: "1rem", background: "#FFF8EE", borderColor: "#F5C75A" }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Suggested items to reorder:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lowStock.map(i => <span key={i.id} className="tag tag-a">{i.name} ({i.stock} left)</span>)}
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {WHOLESALERS.map(w => (
                <div key={w.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>{w.area} · {w.deliveryTime} delivery</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#856404", background: "#FEF3CD", padding: "2px 8px", borderRadius: 100 }}>★ {w.rating}</span>
                      <span style={{ fontSize: 12, color: "#888" }}>📞 {w.phone}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-o" style={{ fontSize: 12 }} onClick={() => showNotif(`Calling ${w.name}...`)}>Call</button>
                    <button className="btn-p" style={{ fontSize: 12 }} onClick={() => showNotif(`Order placed with ${w.name}!`)}>Place Order</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
