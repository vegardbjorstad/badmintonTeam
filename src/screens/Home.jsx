// src/screens/Home.jsx

import Avatar from "../components/Avatar";
import Btn from "../components/Btn";
import Label from "../components/Label";

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
}) {
  return (
    <>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
          padding: "36px 20px 24px",
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 42 }}>🏸</span>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1,
                color: "#38bdf8",
              }}
            >
              BADMINTON
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                fontWeight: 600,
                letterSpacing: "0.12em",
              }}
            >
              TRENINGSAPP
            </div>
          </div>
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
              background: "#38bdf8",
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
                  border: `2px solid ${active ? "#38bdf8" : "#1e3a5f"}`,
                }}
              >
                <Avatar name={p.name} size={46} colorIndex={i} />
                <span style={{ fontSize: 18, fontWeight: 600, flex: 1 }}>{p.name}</span>
                <span
                  style={{
                    fontSize: 22,
                    color: active ? "#38bdf8" : "#334155",
                  }}
                >
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
        >
          {loading ? "STARTER..." : `🏸 START ØKT (${checkedIn.length} spillere)`}
        </Btn>

        <div style={{ height: 10 }} />

        {/* Statistikk-knapp */}
        <Btn variant="ghost" onClick={goToStats}>
          📊 Statistikk & historikk
        </Btn>
      </div>
    </>
  );
}