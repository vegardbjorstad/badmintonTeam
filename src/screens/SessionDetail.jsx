// src/screens/SessionDetail.jsx

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

/**
 * SessionDetail-skjermen
 * ----------------------
 * Viser detaljer for én fullført økt:
 *  - Antall kamper og spillere
 *  - Spillerstatistikk for økten
 *  - Alle kampresultater
 *  - Knapp for å slette (soft-delete) økten
 *
 * Props forventet fra App.jsx:
 *   detailSession, playerName,
 *   computeStats, softDeleteSession,
 *   setScreen
 */
export default function SessionDetail({
  detailSession,
  playerName,
  computeStats,
  softDeleteSession,
  setScreen,
}) {
  if (!detailSession) return null;

  const ds = detailSession;
  const dsStats = computeStats(ds.sMatches, ds.sPauses);

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
          onClick={() => setScreen("stats")}
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
          {fmtDate(ds.date)}
        </div>
      </div>

      {/* INNHOLD */}
      <div style={{ padding: 16 }}>

        {/* Slett-knapp */}
        <button
          onClick={() => softDeleteSession(ds.id)}
          style={{
            background: "none",
            border: "2px solid #7f1d1d",
            borderRadius: 10,
            color: "#ef4444",
            padding: "6px 14px",
            marginBottom: 16,
            cursor: "pointer",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.06em",
          }}
        >
          🗑 SLETT ØKT
        </button>

        {/* Oppsummerings-kort */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            ["🏸", ds.matchCount, "kamper"],
            ["👥", ds.participantIds.length, "spillere"],
          ].map(([icon, val, label]) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: "#0f172a",
                border: "2px solid #1e3a5f",
                borderRadius: 14,
                padding: "14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#38bdf8",
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: 12, color: "#475569" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Spillerstatistikk */}
        <Label>SPILLERSTATISTIKK DENNE ØKTEN</Label>
        <StatsTable rows={dsStats} />

        <div style={{ height: 16 }} />

        {/* Kampresultater */}
        <Label>KAMPRESULTATER</Label>
        <Card>
          {ds.sMatches.length === 0 ? (
            <div
              style={{
                padding: "20px",
                color: "#334155",
                textAlign: "center",
              }}
            >
              Ingen kamper
            </div>
          ) : (
            ds.sMatches.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  padding: "12px 16px",
                  gap: 8,
                  borderBottom:
                    i < ds.sMatches.length - 1
                      ? "1px solid #1e293b"
                      : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: m.winner === 1 ? "#16a34a" : "#94a3b8",
                    fontWeight: m.winner === 1 ? 700 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {playerName(m.team1_p1)}/{playerName(m.team1_p2)}
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#f8fafc",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {m.score_team1}–{m.score_team2}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: m.winner === 2 ? "#16a34a" : "#94a3b8",
                    fontWeight: m.winner === 2 ? 700 : 400,
                    textAlign: "right",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {playerName(m.team2_p1)}/{playerName(m.team2_p2)}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
