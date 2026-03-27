import { useState, useRef, useCallback } from "react";

const INITIAL_COLUMNS = {
  done: {
    title: "DONE",
    emoji: "✅",
    color: "#10b981",
    items: [
      { id: "d1", title: "Backend API (FastAPI + PostgreSQL)", desc: "FastAPI app with async PostgreSQL via asyncpg. Deployed to Railway with auto HTTPS. Health check endpoint. Server-side dashboard auth (username + password via /api/auth/login). No credentials exposed in frontend HTML. Logout button clears session." },
      { id: "d2", title: "FMCSA Carrier Verification", desc: "Real FMCSA SAFER API integration. No mock fallbacks — returns ineligible on any API failure. Input sanitization on MC numbers. Verified: MC 260913, 382806, 780050, 100000, 1234. Two-factor identity check: MC number + carrier must state company name. Agent never reveals company name from FMCSA records." },
      { id: "d3", title: "MC Verification Security", desc: "Hard limit of 2 MC attempts per call, no third attempt. After 2 failures: auto-transfer to human rep. Carriers with 4+ previous failed verifications: auto-transfer without attempting. Failed carriers directed to safersys.org. No loads, rates, or freight discussed until MC verified." },
      { id: "d4", title: "Load Search Engine", desc: "Fuzzy search on origin/destination/equipment. Broad query guard: rejects 'any/anywhere' for both origin + destination. 'Anything' equipment handled without filter. Requires at least one of origin, destination, or equipment. 25 seeded loads across US corridors. Loads auto-marked unavailable when booked. Reseed/refresh endpoints." },
      { id: "d5", title: "3-Round Negotiation Engine", desc: "20% markdown pricing strategy: search_loads returns loadboard_rate × 0.80. Agent quotes discounted rate, has no visibility into real loadboard rate. Round 1: 100%, Round 2: 105%, Round 3: 110% caps. Counter messages never reference real rate. All amounts rounded to whole dollars. Each round logged to negotiations table. Instant accept if carrier offers at/below loadboard rate." },
      { id: "d6", title: "Missed Opportunity Analysis", desc: "Auto-analyzes gap when negotiation fails. Within 15%: 'Near-miss deal. Worth manual follow-up.' Over 15%: 'Too far apart.' Gap percentage, dollar amounts, and recommendation stored in notes." },
      { id: "d7", title: "Transfer Endpoint", desc: "Accepts JSON body or query params. Handles empty/missing call_id gracefully." },
      { id: "d8", title: "Call Logging API", desc: "POST /api/calls/log with flexible schema. Auto-generates call_id if missing (uuid). Handles boolean sentiment, int MC numbers, empty strings. Accepts transcript as string, list, or empty array. Accepts both call_duration and call_duration_seconds. model_validator cleans all payloads." },
      { id: "d9", title: "SMS Update Endpoint", desc: "POST /api/calls/update-sms patches SMS text and notes onto existing call record. Separates SMS logging from main call logging to avoid data overwrites. Works with HappyRobot Paths node (booked branch)." },
      { id: "d10", title: "Data Maintenance Endpoints", desc: "POST /api/reset: clears all calls and negotiations. POST /api/calls/cleanup: deletes calls with no carrier data. POST /api/calls/backfill: normalizes sentiment, backfills loadboard_rate, fixes negotiation_rounds, cleans empty strings to NULL. POST /api/loads/refresh & /api/loads/reseed." },
      { id: "d11", title: "API Security", desc: "API key auth on ALL /api/* endpoints via middleware (JSONResponse). Dashboard auth: server-side validation, returns API key on success. HTTPS via Railway auto TLS. Rate limiting via SlowAPI (30/min verify, 60/min search/log, 10/min transfer, 5/min reset). Input sanitization." },
      { id: "d12", title: "HappyRobot Voice Agent", desc: "Agent 'Sarah' from carrier sales team. GPT-4.1 model. Professional female voice, office background. Recording disclaimer. 19 freight key terms. Numerals on. Never reveals company name, brokerage, or internal systems. Identifies as 'Sarah, part of the carrier sales team' if asked about being AI." },
      { id: "d13", title: "Agent Conversational Pausing", desc: "Pauses after repeating MC number, stating rate/price, describing load. Waits 3s after yes/no questions. Never stacks multiple info in one turn. 'Are you still there?' after 3s silence. Waits 5s after goodbye before ending call." },
      { id: "d14", title: "Agent Number Pronunciation", desc: "Dollar amounts: 'twenty-eight fifty' not 'two thousand eight hundred fifty'. MC numbers: digit-by-digit with pauses. Miles: 'nine twenty miles'. Weight: 'forty-two thousand pounds' (thousand OK for weight)." },
      { id: "d15", title: "Agent Guardrails", desc: "Off-topic redirected: 'I can only help with booking loads and freight questions.' 2 off-topic redirects then call ended. Never answers math, trivia, music. Reacts naturally to emotions. Never reveals internal systems, pricing strategy, or negotiation logic." },
      { id: "d16", title: "4 Voice Agent Tools", desc: "verify_carrier, search_loads, evaluate_offer, transfer_call — all POST endpoints with x-api-key header." },
      { id: "d17", title: "Post-Call Workflow", desc: "AI Classify (6 outcome tags) + separate AI Classify (4 sentiment tags) + AI Extract. Webhook POST with retry (3 attempts, 5s delay, 2× backoff, 30s max). Paths node routing. SMS on booked (Twilio). SMS webhook: POST /api/calls/update-sms. Missed opportunity webhook on negotiation_failed." },
      { id: "d18", title: "Classify Call Outcome — FIXED", desc: "'booked' tightened: requires load ID + agreed rate + transfer. 'general_inquiry' added for rep requests/questions/hangups. 6 total tags." },
      { id: "d19", title: "Sentiment Classification — FIXED", desc: "Separate AI Classify node (not real-time boolean). 4 labels: positive, neutral, negative, aggressive. Runs on transcript after call ends. Dashboard handles case-insensitive matching." },
      { id: "d20", title: "Agent Prompt — FIXED", desc: "Never reveals company name. Hard limit of 2 MC attempts. Immediate transfer on rep request. 'Anything' equipment handled properly. Full load pitch with all fields. Pausing + number pronunciation rules enforced." },
      { id: "d21", title: "Contact Intelligence", desc: "5-interaction memory window. Auto context for repeat callers. 4+ failed verifications triggers auto-transfer." },
      { id: "d22", title: "Call Intent Classifier", desc: "5 classes: booking, rates, follow up, general inquiry, spam." },
      { id: "d23", title: "Dashboard — Overview Tab", desc: "6 KPI cards, conversion funnel with drop-off visualization, outcomes donut (6 categories), call volume area chart (14d), sentiment bar (case-insensitive), negotiation depth, lane activity SVG map with US outline/city labels/clickable routes, smart alerts (scam, rate anomalies, low inventory), ROI calculator." },
      { id: "d24", title: "Dashboard — Call Log Tab", desc: "Outcome filter buttons with counts (All, Booked, Declined, No Match, Neg. Failed, MC Failed, Inquiry). Lane filter from map clicks. Sortable 12-column table. Transcript 'View' link opens drawer. Empty state with refresh prompt." },
      { id: "d25", title: "Dashboard — Call Detail Drawer", desc: "FMCSA verification status, call details (time, duration mm:ss, load ID), full shipment details from loads JOIN, real negotiation history from /api/calls/{id}/negotiations, outcome with rate delta/preservation, sentiment with icon, notes, SMS Sent section, full transcript in scrollable box." },
      { id: "d26", title: "Dashboard — Lanes Tab", desc: "4 KPI cards, top lanes table with progress bars, full Load Board table (ID, origin, dest, equipment, rate, miles, weight, commodity, pieces, pickup, Available/Booked badge). Reseed Loads button. Empty state." },
      { id: "d27", title: "Dashboard — Performance Tab", desc: "Rate preservation, avg call duration, cost per booking. Round 1 close rate, floor rate hits, avg conceded, avg rounds. Failed vetting rate, sentiment breakdown, equipment demand, repeat carrier rate. AI vs Human comparison table." },
      { id: "d28", title: "Dashboard — Controls", desc: "Server-side login. Logout button (red). Refresh, Fetch New Loads (5 loads, 100 cap), Clear Data with confirm, Reseed Loads on Lanes tab. Live call indicator (10s polling, pulsing cyan). Secret demo mode (triple-click CS logo, yellow badge, mock data)." },
      { id: "d29", title: "Dashboard — Auth", desc: "Login screen with username/password. Server-side validation via POST /api/auth/login. API key returned, stored in sessionStorage. All fetches include API key header. Data loads only after auth. Logout clears sessionStorage." },
      { id: "d30", title: "Call Duration", desc: "Mapped from voice agent Duration output. Accepted as call_duration or call_duration_seconds. Cleaned via clean_int. Displayed as mm:ss in dashboard." },
      { id: "d31", title: "Docker Setup", desc: "docker-compose.yml (PostgreSQL + API + Dashboard). Dockerfile for Railway (python:3.12-slim, uvicorn on 8080). .env.example documented. DEMO_MODE=false in production." },
      { id: "d32", title: "Documentation", desc: "Build Description v3 with MC security, pausing, number formatting, pricing strategy, all features, all endpoints, HappyRobot nodes, future improvements. Negotiation Strategy document. Agent prompt (agent-prompt-final.md). Platform context doc. README with live URLs." },
      { id: "d33", title: "Git Repository", desc: "GitHub: shwetachavan77/logistics-ops-automation. All configs in happyrobot-config/ folder. Agent prompt, workflow config, tools config, knowledge base." },
    ],
  },
  todo: {
    title: "TO DO",
    emoji: "📋",
    color: "#3b82f6",
    items: [
      { id: "t1", title: "Record Clean Demo Calls", desc: "Reset data, refresh loads. Call 1: Booked with negotiation (MC 260913, Chicago-Dallas, counter to ~$2,400). Call 2: No match (ask for lane not in database). Call 3: Verification failed (MC 150000). Run backfill after calls." },
      { id: "t2", title: "Take Dashboard Screenshot", desc: "Save as dashboard-screenshot.png in repo root. Update README to display it." },
      { id: "t3", title: "Record 5-Minute Demo Video", desc: "Reset dashboard first. Run full booking scenario with negotiation. Show dashboard updating with real data. Walk through all 4 tabs. Show ROI calculator and lane map." },
      { id: "t4", title: "Publish Workflow to Production", desc: "Currently on Dev environment. Switch to Production before final submission." },
    ],
  },
  v2: {
    title: "V2 / PHASE 2",
    emoji: "🚀",
    color: "#8b5cf6",
    items: [
      { id: "v1", title: "Transcript Reliability", desc: "Server-side transcript fetch via HappyRobot API as fallback when webhook transcript is empty. Delayed re-fetch (30s after call ends). Store raw transcript JSON alongside formatted text." },
      { id: "v2", title: "Negotiation Round Tracking v2", desc: "Pass real call_id (room_name) to evaluate_offer so rounds link to correct call. Fallback: match by load_id + timestamp window. Round-by-round visualization with offer/counter timeline chart." },
      { id: "v3", title: "Dynamic Lane Pricing", desc: "Auto-adjust floors based on lane conversion rates. Below 30%: lower floor 5%. Above 70%: raise floor. Historical rate trends per lane to predict optimal pricing." },
      { id: "v4", title: "Time-Decay Pricing", desc: "Loads near pickup get aggressive pricing. 48+ hours: hold firm at 20% markdown. 24 hours: reduce to 10%. 4 hours: drop to near-cost. Prevents deadhead." },
      { id: "v5", title: "Carrier Relationship Scoring", desc: "Track reliability, on-time history, negotiation patterns per carrier. Rating 1-100 from call data. Preferred carriers get 15% markdown instead of 20%. Green badge in dashboard. Endpoint exists: GET /api/carriers/{mc}/history." },
      { id: "v6", title: "Predictive Load Matching", desc: "ML model on historical booking data to predict load acceptance. Factor in: past lanes, equipment, avg rate, time/day. Pre-rank loads so agent leads with highest-probability match." },
      { id: "v7", title: "Outbound Carrier Campaigns", desc: "Store carrier lane preferences on no-match calls. Auto-notify when matching loads appear. Outbound calling on HappyRobot. Warm leads convert higher." },
      { id: "v8", title: "Multi-Language Voice Support", desc: "Spanish-speaking workforce significant in freight. HappyRobot supports 50+ languages. Prompt translation + language setting. Auto-detect and switch dynamically." },
      { id: "v9", title: "Real-Time WebSocket Dashboard", desc: "Replace 10s polling with WebSocket for instant updates. Show call progress live (verified, searching, negotiating, transferred). Real-time notification toasts." },
      { id: "v10", title: "TMS Integration", desc: "Pull live load data from TMS (McLeod, TMW, MercuryGate). Push booking confirmations into TMS. Replace static load database with live sync." },
      { id: "v11", title: "Fraud Detection v2", desc: "Flag same MC from different phone numbers. Detect below-market acceptance (double-brokering). Velocity check: same MC 10+ times/hour. Cross-reference fraud databases. Auto-block." },
      { id: "v12", title: "Voice Sentiment Real-Time Escalation", desc: "Real-time sentiment detection mid-call. If aggressive, auto-offer transfer to human rep. Track sentiment trajectory for coaching insights." },
      { id: "v13", title: "Automated Rate Confirmation", desc: "SendGrid email integration. Auto-send rate con PDF on booking. Include load details, agreed rate, times, broker contact. Endpoint exists: POST /api/confirmations/rate." },
      { id: "v14", title: "Load Coverage Heatmap", desc: "Dashboard view showing geographic gaps. Overlay carrier demand vs supply. Help ops prioritize shipper outreach." },
      { id: "v15", title: "Carrier Onboarding Flow", desc: "New carrier passes FMCSA but no history → trigger onboarding. Collect insurance certificate, W9, carrier packet via SMS/email. Auto-populate carrier profile." },
      { id: "v16", title: "Competitive Rate Intelligence", desc: "Integrate DAT or Truckstop rate data. Show rates vs market average per lane. Dashboard widget: 'Your rate vs market' with recommendations." },
      { id: "v17", title: "Call Recording Playback", desc: "Store call recordings from HappyRobot. Play recordings in dashboard call drawer. Useful for QA and dispute resolution." },
      { id: "v18", title: "Shift-Based Analytics", desc: "Metrics by time of day and day of week. Identify peak call hours for staffing. Show which shifts have highest conversion." },
      { id: "v19", title: "Multi-Brokerage White Label", desc: "Support multiple brokerage clients on one backend. Each gets own agent name, loads, dashboard, pricing. Org-level isolation with tenant_id." },
      { id: "v20", title: "Automated Follow-Up Sequences", desc: "Declined → auto-call back in 48h with new loads. Negotiation failed → SMS revised offer in 24h. No match → text when matching load appears within 7 days." },
      { id: "v21", title: "Dashboard Mobile View", desc: "Responsive layout for tablet/phone. KPI cards stack vertically. Swipeable tabs. Call drawer becomes full-screen modal." },
      { id: "v22", title: "Carrier Self-Service Portal", desc: "Web portal for carriers to browse loads without calling. Filter by lane, equipment, rate range. Click to book → rate confirmation flow. Reduces inbound call volume." },
      { id: "v23", title: "A/B Test Negotiation Strategies", desc: "Test different markdown percentages (15%, 20%, 25%). Test different counter offer phrasing. Compare conversion rates. Auto-select winning strategy per lane." },
      { id: "v24", title: "Voice Cloning for Brand Consistency", desc: "Custom voice model for 'Sarah' so she sounds identical across all calls. Consistent brand experience regardless of model updates." },
      { id: "v25", title: "Compliance and Audit Trail", desc: "Log every tool call, API request, and agent decision with timestamps. Exportable audit trail for regulatory compliance. Admin audit log for dashboard access." },
      { id: "v26", title: "Dashboard RBAC", desc: "Role-based access: admin, manager, viewer. Admin: reset data, reseed, manage settings. Manager: view all, export reports. Viewer: read-only metrics." },
    ],
  },
};

let nextId = 100;

function AddCardForm({ onAdd, onCancel, color }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const titleRef = useRef(null);

  return (
    <div style={{
      background: "var(--card-bg)",
      borderRadius: 8,
      padding: 12,
      marginBottom: 6,
      borderLeft: `3px solid ${color}`,
    }}>
      <input
        ref={titleRef}
        autoFocus
        placeholder="Card title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            onAdd(title.trim(), desc.trim());
            setTitle(""); setDesc("");
          }
          if (e.key === "Escape") onCancel();
        }}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "6px 8px",
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 600,
          outline: "none",
          marginBottom: 6,
          fontFamily: "inherit",
        }}
      />
      <textarea
        placeholder="Description (optional)..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        rows={2}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "6px 8px",
          color: "var(--text-secondary)",
          fontSize: 12,
          outline: "none",
          resize: "vertical",
          fontFamily: "inherit",
          lineHeight: 1.5,
        }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          onClick={() => { if (title.trim()) { onAdd(title.trim(), desc.trim()); setTitle(""); setDesc(""); } }}
          disabled={!title.trim()}
          style={{
            ...actionBtnStyle,
            background: title.trim() ? color : color + "44",
            cursor: title.trim() ? "pointer" : "not-allowed",
          }}
        >Add</button>
        <button onClick={onCancel} style={{ ...actionBtnStyle, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
      </div>
    </div>
  );
}

function Card({ item, columnColor, onDragStart, expanded, onToggle, onDelete }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: "var(--card-bg)",
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 6,
        cursor: "grab",
        borderLeft: `3px solid ${columnColor}`,
        transition: "box-shadow 0.15s, transform 0.15s",
        fontSize: 13,
        lineHeight: 1.4,
        userSelect: "none",
        position: "relative",
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ flex: 1 }}>{item.title}</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
          {hovering && (
            <span
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              style={{ fontSize: 12, color: "#ef444488", cursor: "pointer", padding: "0 2px", lineHeight: 1 }}
              title="Delete card"
            >✕</span>
          )}
          <span style={{ fontSize: 10, color: "var(--text-muted)", transition: "transform 0.15s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6, borderTop: `1px solid ${columnColor}22`, paddingTop: 8 }}>
          {item.desc || "No description."}
        </div>
      )}
    </div>
  );
}

function Column({ id, column, onDragStart, onDrop, onDragOver, expandedCards, toggleCard, collapsed, onToggleCollapse, onExpandAll, onCollapseAll, searchTerm, onAddCard, onDeleteCard }) {
  const count = column.items.length;
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <div
      onDragOver={(e) => { onDragOver(e); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { onDrop(e, id); setDragOver(false); }}
      style={{
        background: dragOver ? "var(--col-bg-hover)" : "var(--col-bg)",
        borderRadius: 12,
        minWidth: collapsed ? 48 : 290,
        maxWidth: collapsed ? 48 : 380,
        flex: collapsed ? "0 0 48px" : "1 1 290px",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 100px)",
        transition: "min-width 0.25s, max-width 0.25s, flex 0.25s, background 0.15s",
        overflow: "hidden",
        border: dragOver ? `1px solid ${column.color}55` : "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: collapsed ? "12px 6px" : "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: collapsed ? "none" : "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: dragOver ? "var(--col-bg-hover)" : "var(--col-bg)",
          zIndex: 2,
          writingMode: collapsed ? "vertical-rl" : "horizontal-tb",
          textOrientation: collapsed ? "mixed" : "initial",
          minHeight: collapsed ? 200 : "auto",
          cursor: "pointer",
        }}
        onClick={onToggleCollapse}
      >
        <span style={{ fontWeight: 700, fontSize: 12, color: column.color, letterSpacing: 0.8, whiteSpace: "nowrap", textTransform: "uppercase" }}>
          {column.emoji} {column.title}
        </span>
        {!collapsed && (
          <span style={{
            background: column.color + "22",
            color: column.color,
            borderRadius: 10,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}>
            {count}
          </span>
        )}
      </div>

      {/* Column controls */}
      {!collapsed && (
        <div style={{ padding: "4px 10px", display: "flex", gap: 4, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {count > 0 && <button onClick={(e) => { e.stopPropagation(); onExpandAll(); }} style={tinyBtnStyle}>Expand</button>}
            {count > 0 && <button onClick={(e) => { e.stopPropagation(); onCollapseAll(); }} style={tinyBtnStyle}>Collapse</button>}
          </div>
          {!adding && (
            <button
              onClick={(e) => { e.stopPropagation(); setAdding(true); }}
              style={{ ...tinyBtnStyle, color: column.color, fontWeight: 600, fontSize: 14, padding: "0 6px", lineHeight: 1 }}
              title="Add card"
            >+</button>
          )}
        </div>
      )}

      {/* Cards */}
      {!collapsed && (
        <div style={{ padding: "4px 10px 10px", overflowY: "auto", flex: 1 }}>
          {adding && (
            <AddCardForm
              color={column.color}
              onAdd={(title, desc) => { onAddCard(id, title, desc); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          )}
          {column.items.map((item) => (
            <Card
              key={item.id}
              item={item}
              columnColor={column.color}
              onDragStart={onDragStart}
              expanded={expandedCards.has(item.id)}
              onToggle={() => toggleCard(item.id)}
              onDelete={onDeleteCard}
            />
          ))}
          {count === 0 && !adding && (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 12, fontStyle: "italic", border: "1px dashed var(--border)", borderRadius: 8 }}>
              {searchTerm ? "No matches" : "Drop items here"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [collapsedCols, setCollapsedCols] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const dragItem = useRef(null);
  const dragSource = useRef(null);

  const handleDragStart = useCallback((e, itemId) => {
    dragItem.current = itemId;
    for (const [colId, col] of Object.entries(columns)) {
      if (col.items.some((i) => i.id === itemId)) {
        dragSource.current = colId;
        break;
      }
    }
    e.dataTransfer.effectAllowed = "move";
  }, [columns]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e, targetColId) => {
    e.preventDefault();
    const itemId = dragItem.current;
    const sourceColId = dragSource.current;
    if (!itemId || !sourceColId || sourceColId === targetColId) return;
    setColumns((prev) => {
      const sourceItems = [...prev[sourceColId].items];
      const idx = sourceItems.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;
      const [item] = sourceItems.splice(idx, 1);
      return {
        ...prev,
        [sourceColId]: { ...prev[sourceColId], items: sourceItems },
        [targetColId]: { ...prev[targetColId], items: [...prev[targetColId].items, item] },
      };
    });
    dragItem.current = null;
    dragSource.current = null;
  }, []);

  const toggleCard = useCallback((id) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((colId) => {
    setCollapsedCols((prev) => {
      const next = new Set(prev);
      next.has(colId) ? next.delete(colId) : next.add(colId);
      return next;
    });
  }, []);

  const addCard = useCallback((colId, title, desc) => {
    const id = `custom-${nextId++}`;
    setColumns((prev) => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        items: [{ id, title, desc }, ...prev[colId].items],
      },
    }));
    setExpandedCards((prev) => new Set(prev).add(id));
  }, []);

  const deleteCard = useCallback((itemId) => {
    setColumns((prev) => {
      const next = {};
      for (const [k, col] of Object.entries(prev)) {
        next[k] = { ...col, items: col.items.filter((i) => i.id !== itemId) };
      }
      return next;
    });
  }, []);

  const expandAllInCol = (colId) => {
    const src = searchTerm ? filteredColumns : columns;
    setExpandedCards((prev) => {
      const next = new Set(prev);
      src[colId].items.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const collapseAllInCol = (colId) => {
    const src = searchTerm ? filteredColumns : columns;
    setExpandedCards((prev) => {
      const next = new Set(prev);
      src[colId].items.forEach((i) => next.delete(i.id));
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set();
    Object.values(columns).forEach((c) => c.items.forEach((i) => all.add(i.id)));
    setExpandedCards(all);
  };
  const collapseAll = () => setExpandedCards(new Set());

  const totalItems = Object.values(columns).reduce((s, c) => s + c.items.length, 0);

  const filteredColumns = searchTerm
    ? Object.fromEntries(
        Object.entries(columns).map(([k, col]) => [
          k,
          {
            ...col,
            items: col.items.filter(
              (i) =>
                i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.desc.toLowerCase().includes(searchTerm.toLowerCase())
            ),
          },
        ])
      )
    : columns;

  const filteredTotal = Object.values(filteredColumns).reduce((s, c) => s + c.items.length, 0);

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', 'SF Pro Display', -apple-system, sans-serif",
      background: "var(--bg)",
      minHeight: "100vh",
      color: "var(--text-primary)",
      "--bg": "#0f1117",
      "--col-bg": "#1a1d27",
      "--col-bg-hover": "#1e2230",
      "--card-bg": "#22263280",
      "--text-primary": "#e8eaed",
      "--text-secondary": "#9aa0a8",
      "--text-muted": "#5f6570",
      "--border": "#2a2e3a",
      "--accent": "#3b82f6",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3a3e4a; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff",
          }}>H</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>HappyRobot FDE Challenge</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12 }}>
              <span>{totalItems} items</span>
              {Object.entries(columns).map(([k, c]) => (
                <span key={k} style={{ color: c.color }}>{c.emoji} {c.items.length}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "6px 10px 6px 28px",
                color: "var(--text-primary)",
                fontSize: 12,
                outline: "none",
                width: 180,
              }}
            />
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)" }}>⌕</span>
          </div>
          {searchTerm && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{filteredTotal} found</span>
          )}
          <button onClick={expandAll} style={btnStyle}>Expand All</button>
          <button onClick={collapseAll} style={btnStyle}>Collapse All</button>
        </div>
      </div>

      {/* Board */}
      <div style={{
        display: "flex",
        gap: 10,
        padding: "14px",
        overflowX: "auto",
        alignItems: "flex-start",
        height: "calc(100vh - 72px)",
      }}>
        {Object.entries(filteredColumns).map(([colId, col]) => (
          <Column
            key={colId}
            id={colId}
            column={col}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            expandedCards={expandedCards}
            toggleCard={toggleCard}
            collapsed={collapsedCols.has(colId)}
            onToggleCollapse={() => toggleCollapse(colId)}
            onExpandAll={() => expandAllInCol(colId)}
            onCollapseAll={() => collapseAllInCol(colId)}
            searchTerm={searchTerm}
            onAddCard={addCard}
            onDeleteCard={deleteCard}
          />
        ))}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#22263280",
  border: "1px solid #2a2e3a",
  borderRadius: 6,
  padding: "5px 10px",
  color: "#9aa0a8",
  fontSize: 11,
  cursor: "pointer",
  fontWeight: 500,
};

const tinyBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#5f6570",
  fontSize: 10,
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: 4,
};

const actionBtnStyle = {
  border: "none",
  borderRadius: 4,
  padding: "5px 14px",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
