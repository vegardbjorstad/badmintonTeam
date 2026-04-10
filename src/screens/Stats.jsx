// src/screens/Stats.jsx

import { useState } from "react";
import Card from "../components/Card";
import Label from "../components/Label";
import StatsTable from "../components/StatsTable";

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

/**
 * Stats-skjermen
 * --------------
 * Viser tre/fire faner:
 *  - Denne økt  (kun når økt pågår)
 *  - Sesong     (totalstatistikk)
 *  - Historikk  (liste over fullførte økter)
 *  - Arkiv      (slettede økter, kun når ingen økt pågår)
 *
 * Props forventet fra App.jsx:
 *   session, statsTab, setStatsTab,
 *   sessionStats, totalStats, sessionList, allSessions,
 *   playerName, setDetailSession, setScreen,
 *   restoreSession
 */
export default function Stats({
  session,
  statsTab,
  setStatsTab,
  sessionStats,
  totalStats,
  sessionList,
  allSessions,
  playerName,
  setDetailSession,
  setScreen,
  restoreSession,
  hideSession,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null); // session-objekt som venter på bekreftelse

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

  return (
    <>
      {/* TOPBAR */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
          padding: "18px 16px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        <button
          onClick={() => setScreen(session ? "session" : "home")}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: 22,
            cursor: "pointer",
            padding: 4,
          }}
        >
          ←
        </button>
        <div
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#38bdf8",
            letterSpacing: "0.04em",
            flex: 1,
          }}
        >
          STATISTIKK
        </div>
      </div>

      {/* FANE-KNAPPER */}
      <div style={{ display: "flex", borderBottom: "2px solid #1e3a5f" }}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatsTab(key)}
            style={{
              flex: 1,
              height: 46,
              background: "none",
              border: "none",
              borderBottom: `3px solid ${statsTab === key ? "#38bdf8" : "transparent"}`,
              color: statsTab === key ? "#38bdf8" : "#64748b",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.06em",
              cursor: "pointer",
              marginBottom: -2,
            }}
          >
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* INNHOLD */}
      <div style={{ padding: 16 }}>

        {/* Denne økt */}
        {statsTab === "session" && <StatsTable rows={sessionStats} />}

        {/* Sesong */}
        {statsTab === "total" && <StatsTable rows={totalStats} />}

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
                  onClick={() => {
                    setDetailSession(s);
                    setScreen("sessionDetail");
                  }}
                  style={{
                    background: "#0f172a",
                    border: "2px solid #1e3a5f",
                    borderRadius: 16,
                    padding: "16px 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ fontSize: 28 }}>🏸</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                        {fmtDate(s.date)}
                      </div>
                      {fmtTime(s.created_at) && (
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: "#38bdf8",
                          fontFamily: "'Barlow Condensed',sans-serif",
                          letterSpacing: "0.04em",
                        }}>
                          kl. {fmtTime(s.created_at)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {s.matchCount} kamper &nbsp;·&nbsp;
                      {s.participantIds.length} spillere
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {s.participantIds.map((id) => (
                        <span
                          key={id}
                          style={{
                            fontSize: 12,
                            background: "#1e3a5f",
                            borderRadius: 6,
                            padding: "2px 8px",
                            color: "#94a3b8",
                          }}
                        >
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

        {/* Arkiv — slettede økter */}
        {statsTab === "archive" && (
          <>
            {/* Bekreftelsesmodal */}
            {confirmDelete && (
              <div style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.80)",
                zIndex: 1000,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 24,
              }}>
                <div style={{
                  background: "#0f172a",
                  border: "2px solid #7f1d1d",
                  borderRadius: 20,
                  padding: 28,
                  maxWidth: 340,
                  width: "100%",
                }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontSize: 22, fontWeight: 800,
                    color: "#f8fafc", marginBottom: 8,
                  }}>
                    Skjul økt?
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 6 }}>
                    Økten fra <strong style={{ color: "#f8fafc" }}>{fmtDate(confirmDelete.date)}</strong> skjules fra arkivet.
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
                    Data beholdes i databasen og påvirker ikke statistikken.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{
                        flex: 1, height: 50, borderRadius: 14,
                        border: "2px solid #1e3a5f",
                        background: "none", color: "#94a3b8",
                        fontFamily: "'Barlow Condensed',sans-serif",
                        fontWeight: 800, fontSize: 15, cursor: "pointer",
                      }}
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={() => {
                        hideSession(confirmDelete.id);
                        setConfirmDelete(null);
                      }}
                      style={{
                        flex: 1, height: 50, borderRadius: 14,
                        border: "none",
                        background: "linear-gradient(135deg,#475569,#334155)",
                        color: "#fff",
                        fontFamily: "'Barlow Condensed',sans-serif",
                        fontWeight: 800, fontSize: 15, cursor: "pointer",
                        letterSpacing: "0.04em",
                      }}
                    >
                      🙈 SKJUL FRA ARKIV
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allSessions.filter((s) => s.deleted_at && !s.hidden).length === 0 && (
                <div style={{ textAlign: "center", color: "#334155", padding: "60px 0" }}>
                  Ingen slettede økter
                </div>
              )}

              {allSessions
                .filter((s) => s.deleted_at && !s.hidden)
                .map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: "#0f172a",
                      border: "2px solid #7f1d1d",
                      borderRadius: 16,
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <div style={{ fontSize: 28 }}>🗃</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#ef4444" }}>
                        {fmtDate(s.date)}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Slettet økt
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => restoreSession(s.id)}
                        style={{
                          background: "none",
                          border: "2px solid #16a34a",
                          color: "#16a34a",
                          padding: "6px 10px",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontFamily: "'Barlow Condensed',sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        ↩ HENT
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        style={{
                          background: "none",
                          border: "2px solid #475569",
                          color: "#64748b",
                          padding: "6px 10px",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontFamily: "'Barlow Condensed',sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        🙈 SKJUL
                      </button>
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
