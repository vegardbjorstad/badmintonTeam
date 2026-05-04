// src/screens/NewSession.jsx
//
// Tab: Ny økt
// Viser spillerliste med innsjekking og start-knapp.

import Avatar from "../components/Avatar";
import Btn from "../components/Btn";
import Label from "../components/Label";

export default function NewSession({
  players,
  checkedIn,
  toggleCheckIn,
  startSession,
  loading,
}) {
  return (
    <div style={{ padding: "20px 16px" }}>

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
              <span style={{ fontSize: 18, fontWeight: 600, flex: 1, color: "#f8fafc" }}>{p.name}</span>
              <span style={{ fontSize: 22, color: active ? "#38bdf8" : "#334155" }}>
                {active ? "✓" : "○"}
              </span>
            </div>
          );
        })}

        {players.length === 0 && (
          <div style={{ color: "#334155", textAlign: "center", padding: "20px 0" }}>
            Legg til spillere i Spillere-fanen først
          </div>
        )}
      </div>

      <Btn
        variant="primary"
        onClick={startSession}
        disabled={checkedIn.length < 2 || loading}
      >
        {loading ? "STARTER..." : `🏸 START ØKT (${checkedIn.length} spillere)`}
      </Btn>
    </div>
  );
}
