import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://jfpuaamfidhueetquxig.supabase.co";
const SUPABASE_ANON = "sb_publishable_2jKFqxcbtGxD7wkIzBAg0g_mnketQUA";
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── MATCH GENERATION ────────────────────────────────────────────────────────

function generateNextMatch(activePlayers, matchHistory, waitingQueue) {
  if (activePlayers.length < 4) return null;
  const ids = activePlayers.map(p => p.id);

  const gamesPlayed  = Object.fromEntries(ids.map(id => [id, 0]));
  const partnerCount = Object.fromEntries(ids.map(id => [id, Object.fromEntries(ids.map(j => [j, 0]))]));
  const oppCount     = Object.fromEntries(ids.map(id => [id, Object.fromEntries(ids.map(j => [j, 0]))]));

  matchHistory.forEach(m => {
    [m.team1[0], m.team1[1], m.team2[0], m.team2[1]].forEach(id => {
      if (id in gamesPlayed) gamesPlayed[id]++;
    });
    [[m.team1[0], m.team1[1]], [m.team2[0], m.team2[1]]].forEach(([a, b]) => {
      if (a in partnerCount && b in partnerCount[a]) { partnerCount[a][b]++; partnerCount[b][a]++; }
    });
    m.team1.forEach(a => m.team2.forEach(b => {
      if (a in oppCount && b in oppCount[a]) { oppCount[a][b]++; oppCount[b][a]++; }
    }));
  });

  const pool = [...ids].sort((a, b) => {
    const aQ = waitingQueue.indexOf(a), bQ = waitingQueue.indexOf(b);
    if (aQ !== -1 && bQ === -1) return -1;
    if (bQ !== -1 && aQ === -1) return 1;
    if (aQ !== -1 && bQ !== -1) return aQ - bQ;
    return gamesPlayed[a] - gamesPlayed[b];
  });

  const cands = pool.slice(0, 4);
  let best = null;
  for (let i = 0; i < cands.length - 1; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      const t1 = [cands[i], cands[j]], t2 = cands.filter(x => !t1.includes(x));
      const score =
        (partnerCount[t1[0]][t1[1]] || 0) + (partnerCount[t2[0]][t2[1]] || 0) +
        t1.flatMap(a => t2.map(b => oppCount[a][b] || 0)).reduce((s, v) => s + v, 0);
      if (!best || score < best.score) best = { t1, t2, score };
    }
  }
  return { team1: best.t1, team2: best.t2, sitting: ids.filter(id => ![...best.t1, ...best.t2].includes(id)) };
}

// ─── HJELPERE ────────────────────────────────────────────────────────────────

const COLORS = ["#f97316","#6366f1","#10b981","#f43f5e","#3b82f6","#a855f7","#eab308","#14b8a6"];
const getInitials = name => name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const fmtDate = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

function Avatar({ name, size = 44, colorIndex = 0 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: COLORS[colorIndex % COLORS.length],
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.36, color: "#fff", flexShrink: 0,
      fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em",
    }}>{getInitials(name)}</div>
  );
}

function Btn({ children, onClick, variant = "primary", style = {}, disabled = false }) {
  const variants = {
    primary: { background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", fontSize: 20, height: 66 },
    success: { background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", fontSize: 20, height: 66 },
    warning: { background: "linear-gradient(135deg,#d97706,#b45309)", color: "#fff", fontSize: 18, height: 58 },
    danger:  { background: "none", border: "2px solid #7f1d1d", color: "#ef4444", fontSize: 15, height: 50 },
    ghost:   { background: "none", border: "2px solid #1e3a5f", color: "#94a3b8", fontSize: 15, height: 50 },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      border: "none", borderRadius: 14, fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 800, letterSpacing: "0.06em", cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1, display: "flex", alignItems: "center",
      justifyContent: "center", gap: 8, width: "100%",
      ...variants[variant], ...style,
    }}>{children}</button>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 18, overflow: "hidden", ...style }}>{children}</div>;
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>{children}</div>;
}

function Toast({ toast }) {
  if (!toast) return null;
  const bg = { error: "#dc2626", success: "#16a34a", info: "#1e40af", warning: "#d97706" }[toast.type] || "#1e40af";
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: bg, color: "#fff", padding: "12px 24px", borderRadius: 12,
      fontWeight: 600, fontSize: 15, zIndex: 9999,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
    }}>{toast.msg}</div>
  );
}

// ─── STATISTIKK-TABELL ───────────────────────────────────────────────────────

function StatsTable({ rows }) {
  if (rows.length === 0) return (
    <div style={{ textAlign: "center", color: "#334155", padding: "48px 0", fontSize: 15 }}>Ingen data ennå</div>
  );
  const medals = ["🥇","🥈","🥉"];
  return (
    <div style={{ background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 34px 34px 34px 46px 38px 42px", padding: "10px 14px", borderBottom: "2px solid #1e3a5f", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#475569" }}>
        <div>SPILLER</div>
        {["K","V","T","P±","Pau","%"].map(h => <div key={h} style={{ textAlign: "center" }}>{h}</div>)}
      </div>
      {rows.map((s, i) => (
        <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 34px 34px 34px 46px 38px 42px", padding: "12px 14px", alignItems: "center", borderBottom: i < rows.length - 1 ? "1px solid #1e293b" : "none", background: i === 0 ? "rgba(56,189,248,0.05)" : "transparent" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, minWidth: 20 }}>{medals[i] || (i + 1)}</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
          </div>
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>{s.games}</div>
          <div style={{ textAlign: "center", color: "#16a34a", fontWeight: 700, fontSize: 14 }}>{s.wins}</div>
          <div style={{ textAlign: "center", color: "#ef4444", fontWeight: 700, fontSize: 14 }}>{s.losses}</div>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: s.diff >= 0 ? "#16a34a" : "#ef4444" }}>{s.diff > 0 ? "+" : ""}{s.diff}</div>
          <div style={{ textAlign: "center", color: "#64748b", fontSize: 13 }}>{s.pauses}</div>
          <div style={{ textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, color: s.pct >= 50 ? "#38bdf8" : "#64748b" }}>{s.pct}%</div>
        </div>
      ))}
      <div style={{ padding: "8px 14px", borderTop: "1px solid #1e293b", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[["K","Kamper"],["V","Vunnet"],["T","Tapt"],["P±","Poengdiff"],["Pau","Pauser"],["%","Vinnprosent"]].map(([k,v]) => (
          <div key={k} style={{ fontSize: 11, color: "#334155" }}><span style={{ color: "#475569", fontWeight: 700 }}>{k}</span> = {v}</div>
        ))}
      </div>
    </div>
  );
}

// ─── HOVED-APP ───────────────────────────────────────────────────────────────

export default function App() {
  // Navigasjon
  const [screen, setScreen] = useState("home"); // home | session | stats | history | sessionDetail

  // Spillere
  const [players, setPlayers]     = useState([]);
  const [newName, setNewName]     = useState("");
  const [checkedIn, setCheckedIn] = useState([]);

  // Pågående økt
  const [session, setSession]           = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [matchNumber, setMatchNumber]   = useState(1);
  const [score, setScore]               = useState({ t1: 0, t2: 0 });
  const [sessionMatches, setSessionMatches] = useState([]);

  // Data fra DB
  const [allSessions, setAllSessions] = useState([]);
  const [allMatches, setAllMatches]   = useState([]);
  const [allPauses, setAllPauses]     = useState([]);

  // For økt-historikk mulighet til å slette økter 




  // UI
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [statsTab, setStatsTab]     = useState("session"); // session | total | history
  const [detailSession, setDetailSession] = useState(null); // økt valgt i historikk
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const toastTimer = useRef(null);

  const showToast = (msg, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  // ── Init ──
  useEffect(() => {
    loadPlayers();
    loadAll();
    const ch = supabase.channel("players-ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, loadPlayers)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel(`sess-${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches", filter: `session_id=eq.${session.id}` },
        () => loadSessionMatches(session.id))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session]);

//sletting av økt med loggfunksjonalitet
async function softDeleteSession(sessionId) {
  console.log("Trying to delete session:", sessionId);

  const { data, error } = await supabase
    .from("sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select();

  if (error) {
    console.error("Supabase error:", error);
    showToast("Feil: klarte ikke å slette økten", "error");
    return;
  }

  console.log("Delete result:", data);
  await loadAll();
  showToast("Økt flyttet til arkiv", "warning");
}


async function restoreSession(sessionId) {
  await supabase
    .from("sessions")
    .update({ deleted_at: null })
    .eq("id", sessionId);

  await loadAll();
  showToast("Økt gjenopprettet ✓", "success");
}

  async function loadPlayers() {
    const { data } = await supabase.from("players").select("*").order("name");
    if (data) setPlayers(data);
  }

  async function loadAll() {
    const [{ data: sessions }, { data: matches }, { data: pauses }] = await Promise.all([
      supabase.from("sessions").select("*").order("date", { ascending: false }),
      supabase.from("matches").select("*"),
      supabase.from("match_pauses").select("*"),
    ]);
    if (sessions) setAllSessions(sessions);
    if (matches)  setAllMatches(matches);
    if (pauses)   setAllPauses(pauses);
  }

  async function loadSessionMatches(sessionId) {
    const { data } = await supabase.from("matches").select("*").eq("session_id", sessionId).order("match_number");
    if (data) setSessionMatches(data);
  }

  // ── Spillere ──
  async function addPlayer() {
    const name = newName.trim();
    if (!name) return;
    const { error } = await supabase.from("players").insert({ name });
    if (error) showToast("Feil ved lagring", "error");
    else { setNewName(""); showToast(`${name} lagt til ✓`, "success"); }
  }

  async function removePlayer(id) {
    await supabase.from("players").delete().eq("id", id);
    setCheckedIn(prev => prev.filter(x => x !== id));
  }

  // ── Start økt ──
  async function startSession() {
    if (checkedIn.length < 4) { showToast("Minst 4 spillere!", "error"); return; }
    setLoading(true);
    const { data, error } = await supabase.from("sessions")
      .insert({ date: new Date().toISOString().slice(0, 10) }).select().single();
    setLoading(false);
    if (error || !data) { showToast("Kunne ikke starte økt", "error"); return; }
    setSession(data);
    setMatchHistory([]); setWaitingQueue([]); setMatchNumber(1); setSessionMatches([]);
    const match = generateNextMatch(activePlayers, [], []);
    setCurrentMatch(match);
    setWaitingQueue(match?.sitting || []);
    setScore({ t1: 0, t2: 0 });
    setScreen("session");
  }

  // ── Avslutt økt ──
  async function endSession() {
    setShowEndConfirm(false);
    // Marker som avsluttet i DB (legg til ended_at)
    await supabase.from("sessions").update({ note: `Avsluttet – ${sessionMatches.length} kamper` }).eq("id", session.id);
    await loadAll();
    setSession(null);
    setCurrentMatch(null);
    setSessionMatches([]);
    setMatchHistory([]);
    setCheckedIn([]);
    showToast("Økt avsluttet ✓", "success");
    setScreen("home");
  }

  // ── Lagre kamp ──
  async function saveMatch() {
    if (!currentMatch || !session) return;
    const { team1, team2 } = currentMatch;
    const winner = score.t1 > score.t2 ? 1 : 2;
    setLoading(true);
    const { data: savedMatch, error } = await supabase.from("matches").insert({
      session_id: session.id, match_number: matchNumber,
      team1_p1: team1[0], team1_p2: team1[1],
      team2_p1: team2[0], team2_p2: team2[1],
      score_team1: score.t1, score_team2: score.t2, winner,
    }).select().single();
    if (error || !savedMatch) { setLoading(false); showToast("Feil ved lagring", "error"); return; }
    if (currentMatch.sitting.length > 0) {
      await supabase.from("match_pauses").insert(
        currentMatch.sitting.map(pid => ({ match_id: savedMatch.id, player_id: pid, session_id: session.id }))
      );
    }
    setLoading(false);
    loadAll();
    const newHistory = [...matchHistory, { team1, team2 }];
    setMatchHistory(newHistory);
    setMatchNumber(n => n + 1);
    showToast("Kamp lagret ✓", "success");
    const next = generateNextMatch(activePlayers, newHistory, currentMatch.sitting);
    setCurrentMatch(next);
    setWaitingQueue(next?.sitting || []);
    setScore({ t1: 0, t2: 0 });
  }

  // ── Angre siste kamp ──
  async function undoLast() {
    if (sessionMatches.length === 0) { showToast("Ingen kamp å angre", "error"); return; }
    const last = sessionMatches[sessionMatches.length - 1];
    setLoading(true);
    await supabase.from("matches").delete().eq("id", last.id);
    setLoading(false);
    const newHistory = matchHistory.slice(0, -1);
    setMatchHistory(newHistory);
    setMatchNumber(n => Math.max(1, n - 1));
    loadAll();
    loadSessionMatches(session.id);
    showToast("Angret ✓", "info");
    setCurrentMatch(generateNextMatch(activePlayers, newHistory, waitingQueue));
    setScore({ t1: 0, t2: 0 });
  }

  // ── Statistikk ──
  function computeStats(matchSet, pauseSet, playerList = players) {
    const stats = {};
    playerList.forEach(p => {
      stats[p.id] = { id: p.id, name: p.name, wins: 0, losses: 0, pFor: 0, pAgainst: 0, pauses: 0, games: 0 };
    });
    matchSet.forEach(m => {
      [[m.team1_p1, m.team1_p2, 1], [m.team2_p1, m.team2_p2, 2]].forEach(([p1, p2, side]) => {
        [p1, p2].forEach(id => {
          if (!stats[id]) return;
          stats[id].games++;
          if (m.winner === side) stats[id].wins++; else stats[id].losses++;
          stats[id].pFor     += side === 1 ? m.score_team1 : m.score_team2;
          stats[id].pAgainst += side === 1 ? m.score_team2 : m.score_team1;
        });
      });
    });
    pauseSet.forEach(p => { if (stats[p.player_id]) stats[p.player_id].pauses++; });
    return Object.values(stats)
      .filter(s => s.games > 0 || s.pauses > 0)
      .map(s => ({ ...s, pct: s.games > 0 ? Math.round(s.wins / s.games * 100) : 0, diff: s.pFor - s.pAgainst }))
      .sort((a, b) => b.pct - a.pct || b.diff - a.diff);
  }

  const activePlayers  = players.filter(p => checkedIn.includes(p.id));
  const playerName     = id => players.find(p => p.id === id)?.name || "?";
  const playerIdx      = id => players.findIndex(p => p.id === id);

  const sessionPauses  = allPauses.filter(p => p.session_id === session?.id);
  const sessionStats   = computeStats(sessionMatches, sessionPauses);
const activeMatches = allMatches.filter(m => {
  const s = allSessions.find(s => s.id === m.session_id);
  return !s?.deleted_at;
});
const activePauses = allPauses.filter(p => {
  const s = allSessions.find(s => s.id === p.session_id);
  return !s?.deleted_at;
});

const totalStats = computeStats(activeMatches, activePauses);

  // ── Økt-historikk: én rad per økt ──
const sessionList = allSessions
  .filter(s => !s.deleted_at)         // ← viktig!
  .map(s => {
    const sMatches = allMatches.filter(m => m.session_id === s.id);
    const sPauses = allPauses.filter(p => p.session_id === s.id);
    const participantIds = [...new Set(
      sMatches.flatMap(m => [
        m.team1_p1, m.team1_p2,
        m.team2_p1, m.team2_p2
      ])
    )];

    return {
      ...s,
      matchCount: sMatches.length,
      participantIds,
      sMatches,
      sPauses
    };
  })
  .filter(s => s.matchCount > 0);


  // ─── RENDER SHELL ────────────────────────────────────────────────────────

  const shell = (children) => (
    <div style={{ minHeight: "100dvh", background: "#020617", color: "#f8fafc", fontFamily: "'Barlow', sans-serif", paddingBottom: 40, maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet" />
      <Toast toast={toast} />
      {children}
    </div>
  );

  const topBar = (title, back, extra) => (
    <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)", padding: "18px 16px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: "2px solid #1e3a5f" }}>
      {back && <button onClick={back} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: 4 }}>←</button>}
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#38bdf8", letterSpacing: "0.04em", flex: 1 }}>{title}</div>
      {extra}
    </div>
  );

  // ── BEKREFT AVSLUTT ──────────────────────────────────────────────────────
  const EndConfirmModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 10 }}>Avslutt økt?</div>
        <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>
          Økten har {sessionMatches.length} kamper registrert. Den vil lagres i historikken.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setShowEndConfirm(false)} style={{ flex: 1 }}>Avbryt</Btn>
          <Btn variant="warning" onClick={endSession} style={{ flex: 1 }}>Avslutt økt</Btn>
        </div>
      </div>
    </div>
  );

  // ── HOME ─────────────────────────────────────────────────────────────────
  if (screen === "home") return shell(<>
    <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)", padding: "36px 20px 24px", borderBottom: "2px solid #1e3a5f" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 42 }}>🏸</span>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, lineHeight: 1, color: "#38bdf8" }}>BADMINTON</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.12em" }}>TRENINGSAPP</div>
        </div>
      </div>
    </div>

    <div style={{ padding: "20px 16px" }}>
      <Label>LEGG TIL SPILLER</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addPlayer()}
          placeholder="Fullt navn..."
          style={{ flex: 1, height: 54, borderRadius: 12, border: "2px solid #1e3a5f", background: "#0f172a", color: "#f8fafc", fontSize: 16, padding: "0 16px", outline: "none", fontFamily: "'Barlow',sans-serif" }} />
        <button onClick={addPlayer} style={{ width: 54, height: 54, borderRadius: 12, background: "#38bdf8", border: "none", color: "#0f172a", fontSize: 28, fontWeight: 700, cursor: "pointer" }}>+</button>
      </div>

      <Label>SPILLERE — TRYKK FOR Å SJEKKE INN ({checkedIn.length} inne)</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {players.map((p, i) => {
          const active = checkedIn.includes(p.id);
          return (
            <div key={p.id} onClick={() => setCheckedIn(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 14, cursor: "pointer", background: active ? "#0c2a4a" : "#0f172a", border: `2px solid ${active ? "#38bdf8" : "#1e3a5f"}` }}>
              <Avatar name={p.name} size={46} colorIndex={i} />
              <span style={{ fontSize: 18, fontWeight: 600, flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 22, color: active ? "#38bdf8" : "#334155" }}>{active ? "✓" : "○"}</span>
              <button onClick={e => { e.stopPropagation(); removePlayer(p.id); }}
                style={{ background: "none", border: "none", color: "#ef4444", fontSize: 22, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
            </div>
          );
        })}
        {players.length === 0 && <div style={{ color: "#334155", textAlign: "center", padding: "20px 0" }}>Ingen spillere ennå</div>}
      </div>

      <Btn variant="primary" onClick={startSession} disabled={checkedIn.length < 4 || loading}>
        {loading ? "STARTER..." : `🏸  START ØKT  (${checkedIn.length} spillere)`}
      </Btn>
      <div style={{ height: 10 }} />
      <Btn variant="ghost" onClick={() => { setStatsTab("total"); setScreen("stats"); }}>📊  Statistikk & historikk</Btn>
    </div>
  </>);

  // ── SESSION ───────────────────────────────────────────────────────────────
  if (screen === "session" && currentMatch) return shell(<>
    {showEndConfirm && <EndConfirmModal />}
    {topBar(
      `KAMP ${matchNumber}`,
      () => setScreen("home"),
      <button onClick={() => setShowEndConfirm(true)} style={{
        background: "none", border: "2px solid #7f1d1d", borderRadius: 10, color: "#ef4444",
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13,
        padding: "6px 14px", cursor: "pointer", letterSpacing: "0.06em",
      }}>AVSLUTT ØKT</button>
    )}

    <div style={{ padding: 16 }}>
      {/* Kampkort */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ padding: "18px 18px 10px" }}>
          <Label>LAG 1 🟠</Label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {currentMatch.team1.map(id => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={playerName(id)} size={48} colorIndex={playerIdx(id)} />
                <span style={{ fontSize: 18, fontWeight: 600 }}>{playerName(id)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
          <div style={{ flex: 1, height: 1, background: "#1e3a5f" }} />
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, color: "#475569", letterSpacing: "0.1em" }}>VS</span>
          <div style={{ flex: 1, height: 1, background: "#1e3a5f" }} />
        </div>
        <div style={{ padding: "10px 18px 18px" }}>
          <Label>LAG 2 🟣</Label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {currentMatch.team2.map(id => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={playerName(id)} size={48} colorIndex={playerIdx(id)} />
                <span style={{ fontSize: 18, fontWeight: 600 }}>{playerName(id)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Hvem venter */}
      {currentMatch.sitting.length > 0 && (
        <Card style={{ marginBottom: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>⏳</span>
          <div>
            <Label>VENTER DENNE KAMPEN</Label>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>{currentMatch.sitting.map(playerName).join(" & ")}</div>
          </div>
        </Card>
      )}

      {/* Score */}
      <Card style={{ marginBottom: 14, padding: "18px" }}>
        <Label>KAMPRESULTAT</Label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, marginBottom: 8 }}>LAG 1</div>
            <ScoreBig value={score.t1} onChange={v => setScore(s => ({ ...s, t1: v }))} win={score.t1 > score.t2} />
          </div>
          <div style={{ padding: "0 12px", color: "#334155", fontSize: 28, fontWeight: 700, paddingTop: 24 }}>—</div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, marginBottom: 8 }}>LAG 2</div>
            <ScoreBig value={score.t2} onChange={v => setScore(s => ({ ...s, t2: v }))} win={score.t2 > score.t1} />
          </div>
        </div>
      </Card>

      {/* Kamp-logg */}
      {sessionMatches.length > 0 && (
        <Card style={{ marginBottom: 14, padding: "14px 16px" }}>
          <Label>KAMPER DENNE ØKTEN ({sessionMatches.length})</Label>
          {[...sessionMatches].reverse().slice(0, 4).map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: i > 0 ? "1px solid #1e3a5f" : "none", fontSize: 13, color: "#94a3b8" }}>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {playerName(m.team1_p1)}/{playerName(m.team1_p2)}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, color: "#f8fafc", fontSize: 18, margin: "0 10px", flexShrink: 0 }}>
                {m.score_team1}–{m.score_team2}
              </span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                {playerName(m.team2_p1)}/{playerName(m.team2_p2)}
              </span>
            </div>
          ))}
        </Card>
      )}

      <Btn variant="success" onClick={saveMatch} disabled={loading || score.t1 === score.t2}>
        {loading ? "LAGRER..." : "LAGRE & NESTE KAMP →"}
      </Btn>
      {score.t1 === score.t2 && score.t1 > 0 &&
        <div style={{ textAlign: "center", fontSize: 12, color: "#ef4444", marginTop: 6 }}>Uavgjort er ikke tillatt</div>
      }
      <div style={{ height: 8 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="danger" onClick={undoLast} disabled={loading || sessionMatches.length === 0} style={{ flex: 1 }}>↩ ANGRE</Btn>
        <Btn variant="ghost" onClick={() => { setStatsTab("session"); setScreen("stats"); }} style={{ flex: 1 }}>📊 TABELL</Btn>
      </div>
    </div>
  </>);

  // ── STATISTIKK ─────────────────────────────────────────────────────────
  if (screen === "stats") return shell(<>
    {topBar("STATISTIKK", () => setScreen(session ? "session" : "home"))}

    {/* Tre tabs */}
    <div style={{ display: "flex", borderBottom: "2px solid #1e3a5f" }}>
      {(session
        ? [["session","Denne økt"],["total","Sesong"],["history","Historikk"]]
        : [["total","Sesong"],["history","Historikk"],["archive","Arkiv"]]
      ).map(([key, label]) => (
        <button key={key} onClick={() => setStatsTab(key)} style={{
          flex: 1, height: 46, background: "none", border: "none",
          borderBottom: `3px solid ${statsTab === key ? "#38bdf8" : "transparent"}`,
          color: statsTab === key ? "#38bdf8" : "#64748b",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          fontSize: 14, letterSpacing: "0.06em", cursor: "pointer", marginBottom: -2,
        }}>{label.toUpperCase()}</button>
      ))}
    </div>

    <div style={{ padding: 16 }}>
  {statsTab === "session" && <StatsTable rows={sessionStats} />}
  {statsTab === "total"   && <StatsTable rows={totalStats} />}
  {statsTab === "history" && (
    sessionList.length === 0
      ? <div style={{ textAlign: "center", color: "#334155", padding: "60px 0" }}>Ingen fullførte økter ennå</div>
      : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessionList.map(s => (
            <div key={s.id}
              onClick={() => { setDetailSession(s); setScreen("sessionDetail"); }}
              style={{ background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>📅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#f8fafc", marginBottom: 4 }}>{fmtDate(s.date)}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {s.matchCount} kamper &nbsp;·&nbsp;
                  {s.participantIds.length} spillere
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {s.participantIds.map(id => (
                    <span key={id} style={{ fontSize: 12, background: "#1e3a5f", borderRadius: 6, padding: "2px 8px", color: "#94a3b8" }}>
                      {playerName(id)}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ color: "#334155", fontSize: 20 }}>›</div>
            </div>
          ))}
        </div>
  )}

  {/** --------------------------------------
       🚀 ARKIV-FANEN (MÅ ligge inni padding-diven)
      --------------------------------------- */}

  {statsTab === "archive" && (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {allSessions.filter(s => s.deleted_at).length === 0 &&
        <div style={{ textAlign:"center", color:"#334155", padding:"60px 0" }}>
          Ingen slettede økter
        </div>
      }

      {allSessions
        .filter(s => s.deleted_at)
        .map(s => (
          <div key={s.id}
               style={{
                 background:"#0f172a",
                 border:"2px solid #7f1d1d",
                 borderRadius:16,
                 padding:"16px 18px",
                 display:"flex",
                 alignItems:"center",
                 gap:14
               }}>
            <div style={{ fontSize:28 }}>🗃</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#ef4444" }}>
                {fmtDate(s.date)}
              </div>
              <div style={{ fontSize:12, color:"#64748b" }}>
                Slettet økt – kan gjenopprettes
              </div>
            </div>

            <button
              onClick={() => restoreSession(s.id)}
              style={{
                background:"none",
                border:"2px solid #16a34a",
                color:"#16a34a",
                padding:"6px 10px",
                borderRadius:10,
                cursor:"pointer"
              }}>
              ↩ HENT
            </button>
          </div>
        ))}
    </div>
  )}
</div>  {/* ← DENNE skal være etter både history og archive */}
  </>);

  // ── ØKTDETALJ ────────────────────────────────────────────────────────────
  if (screen === "sessionDetail" && detailSession) {
    const ds = detailSession;
    const dsStats = computeStats(ds.sMatches, ds.sPauses);
    return shell(<>
      {topBar(fmtDate(ds.date), () => setScreen("stats"))}
  
  <button
  onClick={() => softDeleteSession(ds.id)}
  style={{
    background:"none",
    border:"2px solid #7f1d1d",
    borderRadius:10,
    color:"#ef4444",
    padding:"6px 14px",
    marginBottom:16,
    cursor:"pointer"
  }}>
  🗑 SLETT ØKT
</button>

      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            ["🏸", ds.matchCount, "kamper"],
            ["👥", ds.participantIds.length, "spillere"],
          ].map(([icon, val, label]) => (
            <div key={label} style={{ flex: 1, background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 800, color: "#38bdf8" }}>{val}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{label}</div>
            </div>
          ))}
        </div>

        <Label>SPILLERSTATISTIKK DENNE ØKTEN</Label>
        <StatsTable rows={dsStats} />

        <div style={{ height: 16 }} />
        <Label>KAMPRESULTATER</Label>
        <Card>
          {ds.sMatches.length === 0
            ? <div style={{ padding: "20px", color: "#334155", textAlign: "center" }}>Ingen kamper</div>
            : ds.sMatches.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: i < ds.sMatches.length - 1 ? "1px solid #1e293b" : "none" }}>
                <div style={{ flex: 1, fontSize: 13, color: m.winner === 1 ? "#16a34a" : "#94a3b8", fontWeight: m.winner === 1 ? 700 : 400 }}>
                  {playerName(m.team1_p1)}/{playerName(m.team1_p2)}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", margin: "0 12px", flexShrink: 0 }}>
                  {m.score_team1}–{m.score_team2}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: m.winner === 2 ? "#16a34a" : "#94a3b8", fontWeight: m.winner === 2 ? 700 : 400, textAlign: "right" }}>
                  {playerName(m.team2_p1)}/{playerName(m.team2_p2)}
                </div>
              </div>
            ))
          }
        </Card>
      </div>
    </>);
  }

  return shell(<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Laster...</div>);
}

// ─── SCORE-KNAPPER ───────────────────────────────────────────────────────────
function ScoreBig({ value, onChange, win }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button onClick={() => onChange(Math.min(30, value + 1))} style={{ width: 62, height: 52, borderRadius: 12, fontSize: 26, fontWeight: 700, background: "#1e3a5f", border: "none", color: "#38bdf8", cursor: "pointer" }}>+</button>
      <div style={{ width: 72, height: 72, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 40, fontWeight: 800, background: win ? "rgba(22,163,74,0.15)" : "#0f172a", border: `3px solid ${win ? "#16a34a" : "#1e3a5f"}`, color: win ? "#16a34a" : "#f8fafc", transition: "all 0.2s" }}>
        {value}
      </div>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={{ width: 62, height: 52, borderRadius: 12, fontSize: 30, fontWeight: 700, background: "#0f172a", border: "2px solid #1e3a5f", color: "#64748b", cursor: "pointer" }}>−</button>
    </div>
  );
}
