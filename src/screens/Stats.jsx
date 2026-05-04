// src/screens/Stats.jsx

import { useState } from "react";
import Card from "../components/Card";
import Label from "../components/Label";
import StatsTable from "../components/StatsTable";
import PlayerProfile from "./PlayerProfile";

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("nb-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fmtTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
};

export default function Stats({
  session,
  statsTab,
  setStatsTab,
  sessionStats,
  sessionStatsSingles,
  totalStats,
  totalStatsSingles,
  sessionList,
  allSessions,
  allMatches,
  players,
  playerName,
  setDetailSession,
  setScreen,
  restoreSession,
  hideSession,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [matchType, setMatchType] = useState("doubles");

  if (selectedPlayer) return (
    <PlayerProfile
      player={selectedPlayer}
      players={players}
      allMatches={allMatches}
      allSessions={allSessions}
      onBack={() => setSelectedPlayer(null)}
    />
  );

  const tabs = session
    ? [
        ["session", "Denne økt"],
        ["total", "Sesong"],
        ["history", "Historikk"],
      ]
    : [
        ["total", "Sesong"],
        ["history", "Historikk"],
        ["archive", "Arkiv"],
      ];

  const activeSessionStats = matchType === "singles" ? sessionStatsSingles : sessionStats;
  const activeTotalStats   = matchType === "singles" ? totalStatsSingles   : totalStats;

  // Singel/dobbel-velger — vises på sesong og denne økt
  const TypeToggle = () => (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <button
        onClick={() => setMatchType("doubles")}
        style={{ flex: 1, height: 38, borderRadius: 10, border: `2px solid ${matchType === "doubles" ? "#38bdf8" : "#1e3a5f"}`, background: matchType === "doubles" ? "#0c2a3f" : "none", color: matchType === "doubles" ? "#38bdf8" : "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
        DOBBEL
      </button>
      <button
        onClick={() => setMatchType("singles")}
        style={{ flex: 1, height: 38, borderRadius: 10, border: `2px solid ${matchType === "singles" ? "#a78bfa" : "#1e3a5f"}`, background: matchType === "singles" ? "#1a1040" : "none", color: matchType === "singles" ? "#a78bfa" : "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
        SINGEL
      </button>
    </div>
  );

  return (
    <>
      {/* FANE-KNAPPER */}
      <div style={{ display: "flex", borderBottom: "2px solid #1e3a5f" }}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatsTab(key)}
            style={{
              flex: 1, height: 46, background: "none", border: "none",
              borderBottom: `3px solid ${statsTab === key ? "#38bdf8" : "transparent"}`,
              color: statsTab === key ? "#38bdf8" : "#64748b",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700, fontSize: 14, letterSpacing: "0.06em",
              cursor: "pointer", marginBottom: -2,
            }}
          >
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* Denne økt */}
        {statsTab === "session" && (
          <>
            <TypeToggle />
            <StatsTable rows={activeSessionStats} />
          </>
        )}

        {/* Sesong */}
        {statsTab === "total" && (
          <div>
            <TypeToggle />
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
              Trykk på en spiller for personlig statistikk
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#1e3a5f", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px 40px 52px", gap: 6, padding: "10px 14px", background: "#0a1628" }}>
                {["Spiller", "K", "S", "T", "%"].map(h => (
                  <div key={h} style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", textAlign: h === "Spiller" ? "left" : "right" }}>{h}</div>
                ))}
              </div>
              {(activeTotalStats || []).length === 0 && (
                <div style={{ padding: "24px 14px", color: "#475569", fontSize: 13 }}>
                  Ingen {matchType === "singles" ? "singel" : "dobbel"}kamper registrert ennå
                </div>
              )}
              {(activeTotalStats || []).map((row, i) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedPlayer(players.find(p => p.id === row.id))}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 40px 40px 40px 52px",
                    gap: 6, padding: "12px 14px",
                    background: i % 2 === 0 ? "#0f172a" : "#0a1628",
                    alignItems: "center", cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: matchType === "singles" ? "#a78bfa" : "#38bdf8", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
                    {row.name}
                    <span style={{ fontSize: 11, color: "#475569" }}>›</span>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#94a3b8" }}>{row.games}</div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#16a34a" }}>{row.wins}</div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#ef4444" }}>{row.losses}</div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15,
                      color: row.pct >= 50 ? "#16a34a" : "#ef4444",
                    }}>
                      {row.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historikk */}
        {statsTab === "history" && (
          sessionList.length === 0 ? (
            <div style={{ textAlign: "center", color: "#334155", padding: "60px 0" }}>
              Ingen fullførte økter ennå
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sessionList.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setDetailSession(s)}
                  style={{
                    background: "#0f172a", border: "2px solid #1e3a5f",
                    borderRadius: 16, padding: "16px 18px",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  <div style={{ fontSize: 28 }}>🏸</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                        {fmtDate(s.date)}
                      </div>
                      {fmtTime(s.created_at) && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.04em" }}>
                          kl. {fmtTime(s.created_at)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {s.matchCount} kamper &nbsp;·&nbsp; {s.participantIds.length} spillere
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      {s.participantIds.map((id) => (
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
          )
        )}

        {/* Arkiv */}
        {statsTab === "archive" && (
          <>
            {confirmDelete && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ background: "#0f172a", border: "2px solid #7f1d1d", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>Skjul økt?</div>
                  <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 6 }}>
                    Økten fra <strong style={{ color: "#f8fafc" }}>{fmtDate(confirmDelete.date)}</strong> skjules fra arkivet.
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>Data beholdes i databasen og påvirker ikke statistikken.</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, height: 50, borderRadius: 14, border: "2px solid #1e3a5f", background: "none", color: "#94a3b8", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Avbryt</button>
                    <button onClick={() => { hideSession(confirmDelete.id); setConfirmDelete(null); }} style={{ flex: 1, height: 50, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#475569,#334155)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: "0.04em" }}>🙈 SKJUL FRA ARKIV</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allSessions.filter((s) => s.deleted_at && !s.hidden).length === 0 && (
                <div style={{ textAlign: "center", color: "#334155", padding: "60px 0" }}>Ingen slettede økter</div>
              )}
              {allSessions.filter((s) => s.deleted_at && !s.hidden).map((s) => (
                <div key={s.id} style={{ background: "#0f172a", border: "2px solid #7f1d1d", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 28 }}>🗃</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#ef4444" }}>{fmtDate(s.date)}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Slettet økt</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => restoreSession(s.id)} style={{ background: "none", border: "2px solid #16a34a", color: "#16a34a", padding: "6px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13 }}>↩ HENT</button>
                    <button onClick={() => setConfirmDelete(s)} style={{ background: "none", border: "2px solid #475569", color: "#64748b", padding: "6px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13 }}>🙈 SKJUL</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
