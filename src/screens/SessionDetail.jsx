// src/screens/SessionDetail.jsx

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

export default function SessionDetail({
  detailSession,
  playerName,
  players,
  computeStats,
  softDeleteSession,
  setScreen,
}) {
  const [matchType, setMatchType] = useState("doubles");

  if (!detailSession) return null;

  const ds = detailSession;

  const doublesMatches = ds.sMatches.filter(m => (m.match_type || "doubles") === "doubles");
  const singlesMatches = ds.sMatches.filter(m => (m.match_type || "doubles") === "singles");
  const hasDoubles = doublesMatches.length > 0;
  const hasSingles = singlesMatches.length > 0;

  const dsStats = computeStats(
    matchType === "singles" ? singlesMatches : doublesMatches,
    ds.sPauses,
    players
  );

  const activeMatches = matchType === "singles" ? singlesMatches : doublesMatches;

  return (
    <>
      <div style={{ padding: 16 }}>

        {/* Tilbake + dato-header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <button
            onClick={() => setScreen(null)}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: 4, width: 36 }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>
              {fmtDate(ds.date)}
            </div>
            {fmtTime(ds.created_at) && (
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                kl. {fmtTime(ds.created_at)}
              </div>
            )}
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Slett-knapp */}
        <button
          onClick={() => softDeleteSession(ds.id)}
          style={{
            background: "none", border: "2px solid #7f1d1d", borderRadius: 10,
            color: "#ef4444", padding: "6px 14px", marginBottom: 16,
            cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.06em",
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
            <div key={label} style={{ flex: 1, background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 800, color: "#38bdf8" }}>{val}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Singel/dobbel-velger — kun vis hvis begge typer finnes */}
        {hasDoubles && hasSingles && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setMatchType("doubles")}
              style={{ flex: 1, height: 38, borderRadius: 10, border: `2px solid ${matchType === "doubles" ? "#38bdf8" : "#1e3a5f"}`, background: matchType === "doubles" ? "#0c2a3f" : "none", color: matchType === "doubles" ? "#38bdf8" : "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              DOBBEL ({doublesMatches.length})
            </button>
            <button
              onClick={() => setMatchType("singles")}
              style={{ flex: 1, height: 38, borderRadius: 10, border: `2px solid ${matchType === "singles" ? "#a78bfa" : "#1e3a5f"}`, background: matchType === "singles" ? "#1a1040" : "none", color: matchType === "singles" ? "#a78bfa" : "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              SINGEL ({singlesMatches.length})
            </button>
          </div>
        )}

        {/* Spillerstatistikk */}
        <Label>{matchType === "singles" ? "SINGELSTATISTIKK DENNE ØKTEN" : "DOBBELSTATISTIKK DENNE ØKTEN"}</Label>
        <StatsTable rows={dsStats} />

        <div style={{ height: 16 }} />

        {/* Kampresultater */}
        <Label>KAMPRESULTATER{hasDoubles && hasSingles ? (matchType === "singles" ? " — SINGEL" : " — DOBBEL") : ""}</Label>
        <Card>
          {activeMatches.length === 0 ? (
            <div style={{ padding: "20px", color: "#334155", textAlign: "center" }}>
              Ingen kamper
            </div>
          ) : (
            activeMatches.map((m, i) => {
              const isSingles = (m.match_type || "doubles") === "singles";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center", padding: "12px 16px", gap: 8,
                    borderBottom: i < activeMatches.length - 1 ? "1px solid #1e293b" : "none",
                  }}
                >
                  <div style={{ fontSize: 13, color: m.winner === 1 ? "#16a34a" : "#94a3b8", fontWeight: m.winner === 1 ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isSingles ? playerName(m.team1_p1) : `${playerName(m.team1_p1)}/${playerName(m.team1_p2)}`}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", textAlign: "center" }}>
                    {m.score_team1}–{m.score_team2}
                  </div>
                  <div style={{ fontSize: 13, color: m.winner === 2 ? "#16a34a" : "#94a3b8", fontWeight: m.winner === 2 ? 700 : 400, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isSingles ? playerName(m.team2_p1) : `${playerName(m.team2_p1)}/${playerName(m.team2_p2)}`}
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </>
  );
}
