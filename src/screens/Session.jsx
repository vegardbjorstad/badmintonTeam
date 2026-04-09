// src/screens/Session.jsx

import { useState } from "react";
import Avatar from "../components/Avatar";
import Btn from "../components/Btn";
import Card from "../components/Card";
import Label from "../components/Label";
import ScoreBig from "../components/ScoreBig";

export default function Session({
  currentMatch,
  matchNumber,
  score,
  setScore,
  playerName,
  playerIdx,
  sessionMatches,
  undoLast,
  saveMatch,
  discardMatch,        // ny prop — forkast kamp og generer ny
  loading,
  setScreen,
  setStatsTab,
  startEndConfirm,
  showAddPlayers,
  setShowAddPlayers,
  notInSessionPlayers,
  addPlayerToOngoingSession,
  inSessionPlayers,
  removePlayerFromSession,
}) {
  const [showZeroModal, setShowZeroModal] = useState(false);

  if (!currentMatch) {
    return <div style={{ padding: 20, color: "#f8fafc" }}>Ingen kamp</div>;
  }

  const isZeroZero = score.t1 === 0 && score.t2 === 0;
  const isDraw     = score.t1 === score.t2 && score.t1 > 0;

  function handleSave() {
    if (isZeroZero) { setShowZeroModal(true); return; }
    if (isDraw) return; // blokkert av UI
    saveMatch();
  }

  return (
    <>
      {/* ── 0-0 MODAL ──────────────────────────────────────────────────── */}
      {showZeroModal && (
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
              Scoren er 0–0
            </div>
            <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>
              Kampen kan ikke lagres uten resultat. Vil du endre scoren, eller forkaste kampen og generere en ny?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Endre resultat */}
              <button
                onClick={() => setShowZeroModal(false)}
                style={{
                  height: 58, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg,#38bdf8,#6366f1)",
                  color: "#fff",
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 800, fontSize: 18,
                  cursor: "pointer", letterSpacing: "0.06em",
                }}
              >
                ← Endre resultat
              </button>

              {/* Forkast og generer ny */}
              <button
                onClick={() => {
                  setShowZeroModal(false);
                  discardMatch();
                }}
                style={{
                  height: 52, borderRadius: 14,
                  border: "2px solid #475569",
                  background: "none",
                  color: "#94a3b8",
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 700, fontSize: 15,
                  cursor: "pointer", letterSpacing: "0.04em",
                }}
              >
                Forkast kamp — generer ny →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div style={{
        background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
        padding: "18px 16px 14px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "2px solid #1e3a5f",
      }}>
        <button
          onClick={() => setScreen("home")}
          style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: 4 }}
        >
          ←
        </button>
        <div style={{
          fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: 22, fontWeight: 800,
          color: "#38bdf8", letterSpacing: "0.04em", flex: 1,
        }}>
          {`KAMP ${matchNumber}`}
        </div>
        <button
          onClick={startEndConfirm}
          style={{
            background: "none", border: "2px solid #7f1d1d",
            borderRadius: 10, color: "#ef4444",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700, fontSize: 13,
            padding: "6px 14px", cursor: "pointer", letterSpacing: "0.06em",
          }}
        >
          AVSLUTT ØKT
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: 16 }}>

        {/* ADMINISTRER SPILLERE */}
        <div style={{ marginBottom: 16 }}>
          <Btn
            variant="ghost"
            onClick={() => setShowAddPlayers(!showAddPlayers)}
            style={{ marginBottom: showAddPlayers ? 12 : 0 }}
          >
            👥 Administrer spillere ({inSessionPlayers.length} inne)
          </Btn>

          {showAddPlayers && (
            <Card style={{ padding: "16px 18px", marginBottom: 16 }}>
              <Label>I ØKTEN NÅ</Label>
              {inSessionPlayers.map((p, i) => {
                const inMatch = currentMatch &&
                  [...currentMatch.team1, ...currentMatch.team2].includes(p.id);
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0",
                    borderBottom: i < inSessionPlayers.length - 1 ? "1px solid #1e293b" : "none",
                  }}>
                    <Avatar name={p.name} size={40} colorIndex={playerIdx(p.id)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc" }}>{p.name}</div>
                      {inMatch && (
                        <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600 }}>spiller nå</div>
                      )}
                    </div>
                    <button
                      onClick={() => removePlayerFromSession(p.id)}
                      style={{
                        background: "none", border: "2px solid #7f1d1d",
                        color: "#ef4444", padding: "4px 10px", borderRadius: 10,
                        cursor: "pointer", fontSize: 13, fontWeight: 700,
                        fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.04em",
                      }}
                    >
                      Fjern
                    </button>
                  </div>
                );
              })}

              {notInSessionPlayers.length > 0 && (
                <>
                  <div style={{ height: 1, background: "#1e3a5f", margin: "16px 0" }} />
                  <Label>LEGG TIL I ØKTEN</Label>
                  {notInSessionPlayers.map((p, i) => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 0",
                      borderBottom: i < notInSessionPlayers.length - 1 ? "1px solid #1e293b" : "none",
                    }}>
                      <Avatar name={p.name} size={40} colorIndex={playerIdx(p.id)} />
                      <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>{p.name}</div>
                      <button
                        onClick={() => addPlayerToOngoingSession(p.id)}
                        style={{
                          background: "none", border: "2px solid #38bdf8",
                          color: "#38bdf8", padding: "4px 10px", borderRadius: 10,
                          cursor: "pointer", fontSize: 13, fontWeight: 700,
                          fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.04em",
                        }}
                      >
                        Legg til
                      </button>
                    </div>
                  ))}
                </>
              )}

              <Btn variant="ghost" style={{ marginTop: 12 }} onClick={() => setShowAddPlayers(false)}>
                Lukk
              </Btn>
            </Card>
          )}
        </div>

        {/* LAG 1 */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ padding: "18px 18px 10px" }}>
            <Label>LAG 1 🟠</Label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {currentMatch.team1.map((id) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={playerName(id)} size={48} colorIndex={playerIdx(id)} />
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{playerName(id)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* VS */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px", marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#1e3a5f" }} />
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, color: "#475569", letterSpacing: "0.1em" }}>VS</span>
          <div style={{ flex: 1, height: 1, background: "#1e3a5f" }} />
        </div>

        {/* LAG 2 */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ padding: "10px 18px 18px" }}>
            <Label>LAG 2 🟣</Label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {currentMatch.team2.map((id) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={playerName(id)} size={48} colorIndex={playerIdx(id)} />
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{playerName(id)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* VENTER */}
        {currentMatch.sitting.length > 0 && (
          <Card style={{ marginBottom: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>⏳</span>
            <div>
              <Label>VENTER DENNE KAMPEN</Label>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>
                {currentMatch.sitting.map(playerName).join(" & ")}
              </div>
            </div>
          </Card>
        )}

        {/* SCORE */}
        <Card style={{ marginBottom: 14, padding: "18px" }}>
          <Label>KAMPRESULTAT</Label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, marginBottom: 8 }}>LAG 1</div>
              <ScoreBig
                value={score.t1}
                onChange={(v) => setScore({ ...score, t1: v })}
                win={score.t1 > score.t2}
              />
            </div>
            <div style={{ padding: "0 12px", color: "#334155", fontSize: 28, fontWeight: 700, paddingTop: 24 }}>—</div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, marginBottom: 8 }}>LAG 2</div>
              <ScoreBig
                value={score.t2}
                onChange={(v) => setScore({ ...score, t2: v })}
                win={score.t2 > score.t1}
              />
            </div>
          </div>
          {/* Uavgjort-advarsel */}
          {isDraw && (
            <div style={{
              textAlign: "center", marginTop: 12,
              color: "#ef4444", fontSize: 13, fontWeight: 600,
            }}>
              Uavgjort er ikke mulig — endre scoren
            </div>
          )}
        </Card>

        {/* HANDLINGSKNAPPER */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <Btn
            variant="ghost"
            onClick={undoLast}
            disabled={sessionMatches.length === 0 || loading}
            style={{ flex: 1 }}
          >
            ↩ Angre
          </Btn>
          <Btn
            onClick={handleSave}
            disabled={loading || isDraw}
            style={{ flex: 2 }}
          >
            {loading ? "Lagrer…" : "Lagre kamp ✓"}
          </Btn>
        </div>

        {/* TABELL */}
        <Btn
          variant="ghost"
          onClick={() => { setStatsTab("table"); setScreen("stats"); }}
          style={{ width: "100%", marginBottom: 14 }}
        >
          📊 Vis tabell
        </Btn>

        {/* KAMP-LOGG */}
        <Card style={{ marginBottom: 14, padding: "14px 16px" }}>
          <Label>KAMPER DENNE ØKTEN ({sessionMatches.length})</Label>
          {sessionMatches.length === 0 && (
            <div style={{ color: "#64748b", paddingTop: 8 }}>Ingen kamper ennå</div>
          )}
          {[...sessionMatches].reverse().map((m, i) => (
            <div key={m.id ?? i} style={{
              display: "grid", gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center", padding: "8px 0",
              borderBottom: i < sessionMatches.length - 1 ? "1px solid #1e293b" : "none",
              fontSize: 13, color: "#94a3b8", gap: 8,
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {playerName(m.team1_p1)}/{playerName(m.team1_p2)}
              </span>
              <span style={{ fontWeight: 700, color: "#f8fafc", whiteSpace: "nowrap", textAlign: "center" }}>
                {m.score_team1}–{m.score_team2}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                {playerName(m.team2_p1)}/{playerName(m.team2_p2)}
              </span>
            </div>
          ))}
        </Card>

      </div>
    </>
  );
}
