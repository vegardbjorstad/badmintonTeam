// src/screens/PlayerProfile.jsx

import { useState } from "react";
import Label from "../components/Label";
import Avatar from "../components/Avatar";

// ── Hjelpelogikk ─────────────────────────────────────────────────────────────

function matchesForPlayer(matches, playerId) {
  return matches.filter(m =>
    m.team1_p1 === playerId || m.team1_p2 === playerId ||
    m.team2_p1 === playerId || m.team2_p2 === playerId
  );
}

function partnerOf(match, playerId) {
  if (match.team1_p1 === playerId) return match.team1_p2;
  if (match.team1_p2 === playerId) return match.team1_p1;
  if (match.team2_p1 === playerId) return match.team2_p2;
  if (match.team2_p2 === playerId) return match.team2_p1;
  return null;
}

function didWin(match, playerId) {
  const onTeam1 = match.team1_p1 === playerId || match.team1_p2 === playerId;
  return (onTeam1 && match.winner === 1) || (!onTeam1 && match.winner === 2);
}

function computePlayerStats(allMatches, allSessions, playerId) {
  const deletedIds = new Set((allSessions || []).filter(s => s.deleted_at).map(s => s.id));
  const matches = matchesForPlayer(allMatches, playerId)
    .filter(m => !deletedIds.has(m.session_id));

  if (matches.length === 0) return null;

  let wins = 0, pFor = 0, pAgainst = 0;
  matches.forEach(m => {
    const onTeam1 = m.team1_p1 === playerId || m.team1_p2 === playerId;
    if (didWin(m, playerId)) wins++;
    pFor     += onTeam1 ? m.score_team1 : m.score_team2;
    pAgainst += onTeam1 ? m.score_team2 : m.score_team1;
  });

  // Per partner totalt
  const partnerMap = {};
  matches.forEach(m => {
    const pid = partnerOf(m, playerId);
    if (!pid) return;
    if (!partnerMap[pid]) partnerMap[pid] = { wins: 0, games: 0 };
    partnerMap[pid].games++;
    if (didWin(m, playerId)) partnerMap[pid].wins++;
  });

  // Per partner per økt
  const partnerTrendRaw = {};
  matches.forEach(m => {
    const pid = partnerOf(m, playerId);
    if (!pid || !m.session_id) return;
    if (!partnerTrendRaw[pid]) partnerTrendRaw[pid] = {};
    if (!partnerTrendRaw[pid][m.session_id]) {
      partnerTrendRaw[pid][m.session_id] = { wins: 0, games: 0, pFor: 0, pAgainst: 0, date: null };
    }
    const entry = partnerTrendRaw[pid][m.session_id];
    const onTeam1 = m.team1_p1 === playerId || m.team1_p2 === playerId;
    entry.games++;
    entry.pFor     += onTeam1 ? m.score_team1 : m.score_team2;
    entry.pAgainst += onTeam1 ? m.score_team2 : m.score_team1;
    if (didWin(m, playerId)) entry.wins++;
  });
  (allSessions || []).forEach(s => {
    Object.values(partnerTrendRaw).forEach(sm => {
      if (sm[s.id]) sm[s.id].date = s.date;
    });
  });
  const partnerTrendSorted = {};
  Object.entries(partnerTrendRaw).forEach(([pid, sm]) => {
    partnerTrendSorted[pid] = Object.entries(sm)
      .filter(([, v]) => v.date && v.games > 0)
      .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
      .map(([, v]) => ({
        date: v.date,
        pct: Math.round((v.wins / v.games) * 100),
        diff: v.pFor - v.pAgainst,
        wins: v.wins, games: v.games,
      }));
  });

  // Utvikling per økt (total)
  const smTotal = {};
  matches.forEach(m => {
    if (!m.session_id) return;
    if (!smTotal[m.session_id]) smTotal[m.session_id] = { wins: 0, games: 0, pFor: 0, pAgainst: 0, date: null };
    const onTeam1 = m.team1_p1 === playerId || m.team1_p2 === playerId;
    smTotal[m.session_id].games++;
    smTotal[m.session_id].pFor     += onTeam1 ? m.score_team1 : m.score_team2;
    smTotal[m.session_id].pAgainst += onTeam1 ? m.score_team2 : m.score_team1;
    if (didWin(m, playerId)) smTotal[m.session_id].wins++;
  });
  (allSessions || []).forEach(s => { if (smTotal[s.id]) smTotal[s.id].date = s.date; });
  const trend = Object.entries(smTotal)
    .filter(([, v]) => v.date && v.games > 0)
    .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
    .map(([id, v]) => ({ sessionId: id, date: v.date, pct: Math.round((v.wins / v.games) * 100), diff: v.pFor - v.pAgainst, wins: v.wins, games: v.games }));

  const last10 = matches.slice(-10).map(m => didWin(m, playerId) ? 1 : 0);

  return {
    games: matches.length, wins, losses: matches.length - wins,
    pct: Math.round((wins / matches.length) * 100),
    pFor, pAgainst, diff: pFor - pAgainst,
    last10, partnerMap, partnerTrendSorted, trend,
  };
}

// ── Linjegraf ─────────────────────────────────────────────────────────────────

function LineGraph({ trend, metric = "pct" }) {
  if (trend.length < 2) return (
    <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "20px 0" }}>
      Trenger minst 2 økter for å vise graf
    </div>
  );

  const W = 340, H = 150, PAD = { top: 20, right: 16, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const values = trend.map(t => metric === "pct" ? t.pct : t.diff);
  const minV = metric === "pct" ? 0 : Math.min(...values, -5);
  const maxV = metric === "pct" ? 100 : Math.max(...values, 5);
  const range = maxV - minV || 1;
  const toX = (i) => trend.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (trend.length - 1)) * innerW;
  const toY = (v) => PAD.top + innerH - ((v - minV) / range) * innerH;
  const points = trend.map((t, i) => `${toX(i)},${toY(values[i])}`).join(" ");
  const fillPoints = [`${toX(0)},${PAD.top + innerH}`, ...trend.map((t, i) => `${toX(i)},${toY(values[i])}`), `${toX(trend.length - 1)},${PAD.top + innerH}`].join(" ");
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  const gridLines = metric === "pct" ? [0, 25, 50, 75, 100] : [minV, 0, maxV];
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {gridLines.map(y => (
        <g key={y}>
          <line x1={PAD.left} y1={toY(y)} x2={PAD.left + innerW} y2={toY(y)}
            stroke={y === 0 && metric === "diff" ? "#334155" : "#1e3a5f"}
            strokeWidth={y === 0 && metric === "diff" ? 1 : 0.5}
            strokeDasharray={y === 50 && metric === "pct" ? "4,3" : "none"} />
          <text x={PAD.left - 4} y={toY(y) + 4} textAnchor="end" fill="#475569" fontSize="9" fontFamily="Barlow Condensed, sans-serif">
            {metric === "pct" ? `${y}%` : (y > 0 ? `+${y}` : y)}
          </text>
        </g>
      ))}
      <line x1={PAD.left} y1={toY(avg)} x2={PAD.left + innerW} y2={toY(avg)}
        stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="6,4" opacity="0.4" />
      <polygon points={fillPoints} fill="#38bdf8" opacity="0.06" />
      <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {trend.map((t, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(values[i])} r="3.5" fill="#38bdf8" />
          <text x={toX(i)} y={toY(values[i]) - 7} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Barlow Condensed, sans-serif" fontWeight="700">
            {metric === "pct" ? `${values[i]}%` : (values[i] > 0 ? `+${values[i]}` : values[i])}
          </text>
        </g>
      ))}
      {trend.map((t, i) => {
        const show = i === 0 || i === trend.length - 1 || trend.length <= 5 || i % Math.floor(trend.length / 4) === 0;
        if (!show) return null;
        return <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="Barlow Condensed, sans-serif">{fmtDate(t.date)}</text>;
      })}
    </svg>
  );
}

// ── Partner-tab ───────────────────────────────────────────────────────────────

const PARTNER_COLORS = ["#38bdf8", "#f97316", "#a78bfa", "#34d399", "#fb7185", "#fbbf24"];

function PartnerTab({ partnerRows, partnerTrendSorted }) {
  const [metric, setMetric]         = useState("pct");
  const [selectedId, setSelectedId] = useState(partnerRows[0]?.id || null);

  if (partnerRows.length === 0) return (
    <div style={{ textAlign: "center", color: "#475569", padding: "40px 0" }}>Ingen partnerdata</div>
  );

  const trend = partnerTrendSorted[selectedId] || [];
  const selected = partnerRows.find(p => p.id === selectedId);

  return (
    <div>
      {/* Partner-velger */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {partnerRows.map((p, pi) => {
          const active = selectedId === p.id;
          const color = PARTNER_COLORS[pi % PARTNER_COLORS.length];
          return (
            <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
              height: 34, padding: "0 12px", borderRadius: 20,
              border: `2px solid ${active ? color : "#1e3a5f"}`,
              background: active ? color + "22" : "none",
              color: active ? color : "#64748b",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Metrikk-velger */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["pct", "Vinner %"], ["diff", "Poengdiff"]].map(([key, label]) => (
          <button key={key} onClick={() => setMetric(key)} style={{
            flex: 1, height: 36, borderRadius: 10,
            border: metric === key ? "none" : "1px solid #1e3a5f",
            background: metric === key ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "#0f172a",
            color: metric === key ? "#fff" : "#64748b",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", cursor: "pointer",
          }}>
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Graf */}
      <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: "16px 12px", marginBottom: 12 }}>
        <LineGraph trend={trend} metric={metric} />
      </div>

      {/* Sammendrag */}
      {selected && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Kamper",  value: selected.games },
            { label: "Seire",   value: selected.wins,  color: "#16a34a" },
            { label: "Vinner%", value: `${selected.pct}%`, color: selected.pct >= 50 ? "#16a34a" : "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: color || "#f8fafc" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabell */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#1e3a5f", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px 56px", gap: 8, padding: "10px 14px", background: "#0a1628" }}>
          {["Partner", "K", "S", "%"].map(h => (
            <div key={h} style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", textAlign: h === "Partner" ? "left" : "right" }}>{h}</div>
          ))}
        </div>
        {partnerRows.map((p, i) => {
          const active = selectedId === p.id;
          return (
            <div key={p.id} onClick={() => setSelectedId(p.id)} style={{
              display: "grid", gridTemplateColumns: "1fr 40px 40px 56px",
              gap: 8, padding: "12px 14px",
              background: active ? "#0c2a4a" : (i % 2 === 0 ? "#0f172a" : "#0a1628"),
              alignItems: "center", cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PARTNER_COLORS[i % PARTNER_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? "#38bdf8" : "#f8fafc" }}>{p.name}</span>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: "#94a3b8" }}>{p.games}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "#94a3b8" }}>{p.wins}</div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, color: p.pct >= 50 ? "#16a34a" : "#ef4444" }}>
                  {p.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Utvikling-tab ─────────────────────────────────────────────────────────────

function TrendTab({ trend }) {
  const [metric, setMetric] = useState("pct");

  return (
    <div>
      {/* Metrikk-velger */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["pct", "Vinner %"], ["diff", "Poengdiff"]].map(([key, label]) => (
          <button key={key} onClick={() => setMetric(key)} style={{
            flex: 1, height: 36, borderRadius: 10,
            border: metric === key ? "none" : "1px solid #1e3a5f",
            background: metric === key ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "#0f172a",
            color: metric === key ? "#fff" : "#64748b",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", cursor: "pointer",
          }}>
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: "16px 12px", marginBottom: 12 }}>
        <LineGraph trend={trend} metric={metric} />
      </div>
      {metric === "pct" && (
        <div style={{ fontSize: 12, color: "#334155", textAlign: "center", marginBottom: 16 }}>
          Stiplet linje = snitt ({trend.length > 0 ? Math.round(trend.reduce((s, t) => s + t.pct, 0) / trend.length) : 0}%)
        </div>
      )}

      <Label>PER ØKT</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#1e3a5f", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 48px 72px", gap: 8, padding: "10px 14px", background: "#0a1628" }}>
          {["Dato", "K", "S", metric === "pct" ? "%" : "+/-"].map(h => (
            <div key={h} style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", textAlign: h === "Dato" ? "left" : "right" }}>{h}</div>
          ))}
        </div>
        {[...trend].reverse().map((t, i) => (
          <div key={t.sessionId} style={{
            display: "grid", gridTemplateColumns: "1fr 48px 48px 72px",
            gap: 8, padding: "12px 14px",
            background: i % 2 === 0 ? "#0f172a" : "#0a1628", alignItems: "center",
          }}>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              {new Date(t.date).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
            </div>
            <div style={{ textAlign: "right", fontSize: 13, color: "#94a3b8" }}>{t.games}</div>
            <div style={{ textAlign: "right", fontSize: 13, color: "#94a3b8" }}>{t.wins}</div>
            <div style={{ textAlign: "right" }}>
              {metric === "pct" ? (
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, color: t.pct >= 50 ? "#16a34a" : "#ef4444" }}>
                  {t.pct}%
                </span>
              ) : (
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, color: t.diff >= 0 ? "#16a34a" : "#ef4444" }}>
                  {t.diff > 0 ? `+${t.diff}` : t.diff}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hoved-komponent ───────────────────────────────────────────────────────────

export default function PlayerProfile({ player, players, allMatches, allSessions, onBack }) {
  const [tab, setTab] = useState("total");
  const stats = computePlayerStats(allMatches, allSessions, player.id);
  const playerIdx = (id) => players.findIndex(p => p.id === id);
  const playerName = (id) => players.find(p => p.id === id)?.name || "?";

  if (!stats) return (
    <div style={{ padding: 24, textAlign: "center", color: "#475569" }}>Ingen kamper registrert ennå</div>
  );

  const partnerRows = Object.entries(stats.partnerMap)
    .map(([id, v]) => ({ id, name: playerName(id), games: v.games, wins: v.wins, losses: v.games - v.wins, pct: Math.round((v.wins / v.games) * 100) }))
    .sort((a, b) => b.games - a.games);

  const TABS = [["total", "Totalt"], ["partner", "Per partner"], ["trend", "Utvikling"]];

  return (
    <div style={{ padding: "16px 16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: 4, width: 36 }}>←</button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Avatar name={player.name} size={44} colorIndex={playerIdx(player.id)} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc" }}>{player.name.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{stats.games} kamper totalt</div>
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Faner */}
      <div style={{ display: "flex", borderBottom: "2px solid #1e3a5f", marginBottom: 16 }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, height: 42, background: "none", border: "none",
            borderBottom: `3px solid ${tab === key ? "#38bdf8" : "transparent"}`,
            color: tab === key ? "#38bdf8" : "#64748b",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.06em",
            cursor: "pointer", marginBottom: -2,
          }}>
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TOTALT */}
      {tab === "total" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Vinner%",   value: `${stats.pct}%`,  color: stats.pct >= 50 ? "#16a34a" : "#ef4444" },
              { label: "Kamper",    value: stats.games },
              { label: "Seire",     value: stats.wins,        color: "#16a34a" },
              { label: "Tap",       value: stats.losses,      color: "#ef4444" },
              { label: "Poeng for", value: stats.pFor },
              { label: "Poengdiff", value: stats.diff > 0 ? `+${stats.diff}` : stats.diff, color: stats.diff >= 0 ? "#16a34a" : "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>{label.toUpperCase()}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 800, color: color || "#f8fafc" }}>{value}</div>
              </div>
            ))}
          </div>
          <Label>FORM — SISTE {stats.last10.length} KAMPER</Label>
          <div style={{ display: "flex", gap: 6 }}>
            {stats.last10.map((w, i) => (
              <div key={i} style={{
                flex: 1, height: 32, borderRadius: 6,
                background: w ? "#16a34a" : "#7f1d1d",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800,
                fontSize: 13, color: w ? "#bbf7d0" : "#fca5a5",
              }}>
                {w ? "S" : "T"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PER PARTNER */}
      {tab === "partner" && (
        <PartnerTab partnerRows={partnerRows} partnerTrendSorted={stats.partnerTrendSorted} />
      )}

      {/* UTVIKLING */}
      {tab === "trend" && (
        <TrendTab trend={stats.trend} />
      )}
    </div>
  );
}
