// src/screens/Home.jsx

import { useState } from "react";
import Avatar from "../components/Avatar";
import Btn from "../components/Btn";
import Label from "../components/Label";
import PushSettings from "../components/PushSettings";

export default function Home({
  players,
  checkedIn,
  newName,
  setNewName,
  addPlayer,
  removePlayer,
  renamePlayer,
  toggleCheckIn,
  loading,
  startSession,
  goToStats,
  club,
  onLogout,
  push,
  nextTraining,
  onSaveTraining,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null); // spiller som venter på bekreftelse
  const [editPlayer, setEditPlayer]       = useState(null);  // spiller som redigeres
  const [editName, setEditName]           = useState("");

  return (
    <>
      {/* Bekreft sletting av spiller */}
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
            border: "2px solid #334155",
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
              Fjern spiller?
            </div>
            <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 6 }}>
              <strong style={{ color: "#f8fafc" }}>{confirmDelete.name}</strong> skjules fra spillerlisten.
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              Statistikk og kamphistorikk beholdes i databasen.
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
                  removePlayer(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                style={{
                  flex: 1, height: 50, borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg,#dc2626,#991b1b)",
                  color: "#fff",
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 800, fontSize: 15, cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                Fjern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rediger spillernavn */}
      {editPlayer && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.80)",
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}>
          <div style={{
            background: "#0f172a",
            border: "2px solid #334155",
            borderRadius: 20,
            padding: 28,
            maxWidth: 340,
            width: "100%",
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 22, fontWeight: 800,
              color: "#f8fafc", marginBottom: 16,
            }}>
              Endre navn
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editName.trim()) {
                  renamePlayer(editPlayer.id, editName.trim());
                  setEditPlayer(null);
                }
                if (e.key === "Escape") setEditPlayer(null);
              }}
              autoFocus
              style={{
                width: "100%",
                height: 52,
                borderRadius: 12,
                border: "2px solid #38bdf8",
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: 18,
                padding: "0 16px",
                outline: "none",
                fontFamily: "'Barlow',sans-serif",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setEditPlayer(null)}
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
                  if (editName.trim()) {
                    renamePlayer(editPlayer.id, editName.trim());
                    setEditPlayer(null);
                  }
                }}
                disabled={!editName.trim()}
                style={{
                  flex: 1, height: 50, borderRadius: 14,
                  border: "none",
                  background: editName.trim()
                    ? "linear-gradient(135deg,#38bdf8,#6366f1)"
                    : "#1e293b",
                  color: editName.trim() ? "#fff" : "#475569",
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 800, fontSize: 15, cursor: editName.trim() ? "pointer" : "default",
                }}
              >
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
          padding: "28px 20px 20px",
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: club?.color || "#38bdf8",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 18, color: "#fff",
            fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0,
          }}>
            {club ? club.name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "🏸"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 20, fontWeight: 800, lineHeight: 1,
              color: club?.color || "#38bdf8", letterSpacing: "0.02em",
            }}>
              {club?.name || "BADMINTON"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.1em", marginTop: 2 }}>
              TRENINGSAPP
            </div>
          </div>
          {onLogout && (
            <button onClick={onLogout} style={{
              background: "none", border: "none", color: "#475569",
              fontSize: 13, cursor: "pointer", fontFamily: "'Barlow',sans-serif",
              padding: "4px 8px",
            }}>
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
                    setEditPlayer(p);
                    setEditName(p.name);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: 16,
                    cursor: "pointer",
                    padding: "0 4px",
                    lineHeight: 1,
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(p);
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

        {/* Push-varsler */}
        {push && (
          <PushSettings
            push={push}
            club={club}
            nextTraining={nextTraining}
            onSaveTraining={onSaveTraining}
          />
        )}

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