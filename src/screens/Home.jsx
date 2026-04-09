// src/screens/Home.jsx

import Avatar from "../components/Avatar";
import Btn from "../components/Btn";
import Label from "../components/Label";

const getInitials = (name) =>
  name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

/**
 * Home
 * ----
 * Endret fra original:
 *   - Viser klubbnavn og klubbfarge i header (fra `club`-prop)
 *   - Logout-knapp øverst til høyre
 *   - Klubbfarge brukes på check-in-border og +-knapp
 *
 * Nye props: club, onLogout
 * Uendrede props: alle originale props
 */
export default function Home({
  players,
  checkedIn,
  newName,
  setNewName,
  addPlayer,
  removePlayer,
  toggleCheckIn,
  loading,
  startSession,
  goToStats,
  // Nye props
  club,
  onLogout,
}) {
  const clubColor = club?.color || "#38bdf8";

  return (
    <>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
          padding: "28px 20px 20px",
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Klubb-avatar med farge */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: clubColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
              color: "#fff",
              fontFamily: "'Barlow Condensed',sans-serif",
              flexShrink: 0,
            }}
          >
            {club ? getInitials(club.name) : "🏸"}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1,
                color: clubColor,
                letterSpacing: "0.02em",
              }}
            >
              {club?.name || "BADMINTON"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                fontWeight: 600,
                letterSpacing: "0.1em",
                marginTop: 2,
              }}
            >
              TRENINGSAPP
            </div>
          </div>

          {/* Logg ut */}
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: "none",
                border: "none",
                color: "#475569",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'Barlow',sans-serif",
                padding: "4px 8px",
              }}
            >
              Logg ut
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px" }}>
        {/* Legg til spiller */}
        <Label>LEGG TIL SPILLER</Label>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayer()}
            placeholder="Fullt navn..."
            style={{
              flex: 1,
              height: 54,
              borderRadius: 12,
              border: "2px solid #1e3a5f",
              background: "#0f172a",
              color: "#f8fafc",
              fontSize: 16,
              padding: "0 16px",
              outline: "none",
              fontFamily: "'Barlow',sans-serif",
            }}
          />
          <button
            onClick={addPlayer}
            style={{
              width: 54,
              height: 54,
              borderRadius: 12,
              background: clubColor,
              border: "none",
              color: "#0f172a",
              fontSize: 28,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>

        {/* Spillerliste */}
        <Label>SPILLERE — TRYKK FOR Å SJEKKE INN ({checkedIn.length} inne)</Label>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {players.map((p, i) => {
            const active = checkedIn.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleCheckIn(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 14px",
                  borderRadius: 14,
                  cursor: "pointer",
                  background: active ? "#0c2a4a" : "#0f172a",
                  border: `2px solid ${active ? clubColor : "#1e3a5f"}`,
                }}
              >
                <Avatar name={p.name} size={46} colorIndex={i} />
                <span style={{ fontSize: 18, fontWeight: 600, flex: 1 }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 22, color: active ? clubColor : "#334155" }}>
                  {active ? "✓" : "○"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePlayer(p.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: 22,
                    cursor: "pointer",
                    padding: "0 4px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}

          {players.length === 0 && (
            <div style={{ color: "#334155", textAlign: "center", padding: "20px 0" }}>
              Ingen spillere ennå
            </div>
          )}
        </div>

        {/* Start økt */}
        <Btn
          variant="primary"
          onClick={startSession}
          disabled={checkedIn.length < 4 || loading}
          style={{
            background:
              checkedIn.length >= 4
                ? `linear-gradient(135deg, ${clubColor}, #6366f1)`
                : undefined,
          }}
        >
          {loading ? "STARTER..." : `🏸 START ØKT (${checkedIn.length} spillere)`}
        </Btn>

        <div style={{ height: 10 }} />

        <Btn variant="ghost" onClick={goToStats}>
          📊 Statistikk & historikk
        </Btn>
      </div>
    </>
  );
}
