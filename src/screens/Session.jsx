// src/screens/Session.jsx

import { useState } from "react";
import Avatar from "../components/Avatar";
import Btn from "../components/Btn";
import Card from "../components/Card";
import Label from "../components/Label";
import ScoreBig from "../components/ScoreBig";

// ── MatchChoiceModal ──────────────────────────────────────────────────────────

function MatchChoiceModal({ title, subtitle, showRevenge, onRevenge, onAuto, onManual, onPlayers, onEnd, playerCount }) {
  const canPlayDoubles = playerCount >= 4;
  const [matchType, setMatchType] = useState(canPlayDoubles ? "doubles" : "singles");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 800, color: "#f8fafc", marginBottom: 6 }}>{title}</div>
        <div style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>{subtitle}</div>

        {/* Singel / Dobbel-velger */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => canPlayDoubles && setMatchType("doubles")}
            style={{ flex: 1, height: 40, borderRadius: 10, border: `2px solid ${matchType === "doubles" ? "#38bdf8" : "#1e3a5f"}`, background: matchType === "doubles" ? "#0c2a3f" : "none", color: matchType === "doubles" ? "#38bdf8" : (canPlayDoubles ? "#475569" : "#1e3a5f"), fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: canPlayDoubles ? "pointer" : "default", opacity: canPlayDoubles ? 1 : 0.35 }}>
            DOBBEL
          </button>
          <button
            onClick={() => setMatchType("singles")}
            style={{ flex: 1, height: 40, borderRadius: 10, border: `2px solid ${matchType === "singles" ? "#a78bfa" : "#1e3a5f"}`, background: matchType === "singles" ? "#1a1040" : "none", color: matchType === "singles" ? "#a78bfa" : "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            SINGEL
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {showRevenge && (
            <button onClick={() => onRevenge(matchType)} style={{ height: 54, borderRadius: 14, border: "2px solid #f97316", background: "#f9731611", color: "#f97316", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 17, cursor: "pointer", letterSpacing: "0.04em" }}>
              🔄 REVANSJE
            </button>
          )}
          <button onClick={() => onAuto(matchType)} style={{ height: 54, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 17, cursor: "pointer", letterSpacing: "0.04em" }}>
            🎲 AUTOMATISK NESTE KAMP
          </button>
          <button onClick={() => onManual(matchType)} style={{ height: 54, borderRadius: 14, border: "2px solid #38bdf8", background: "none", color: "#38bdf8", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 17, cursor: "pointer", letterSpacing: "0.04em" }}>
            ✋ VELG LAG MANUELT
          </button>
          <button onClick={onPlayers} style={{ height: 46, borderRadius: 14, border: "2px solid #1e3a5f", background: "none", color: "#64748b", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            👥 Endre spillere
          </button>
          {onEnd && (
            <button onClick={onEnd} style={{ height: 46, borderRadius: 14, border: "2px solid #7f1d1d", background: "none", color: "#ef4444", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              🛑 Avslutt økt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ManualMatchModal ──────────────────────────────────────────────────────────

function ManualMatchModal({ inSessionPlayers, playerName, playerIdx, onConfirm, onBack, matchType = "doubles" }) {
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);
  const maxPerTeam = matchType === "singles" ? 1 : 2;

  function togglePlayer(id) {
    if (team1.includes(id)) { setTeam1(team1.filter(x => x !== id)); return; }
    if (team2.includes(id)) { setTeam2(team2.filter(x => x !== id)); return; }
    if (team1.length < maxPerTeam) { setTeam1([...team1, id]); return; }
    if (team2.length < maxPerTeam) { setTeam2([...team2, id]); }
  }

  const ready = team1.length === maxPerTeam && team2.length === maxPerTeam;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 20, padding: 24, maxWidth: 340, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 4 }}>
          Velg lag manuelt — {matchType === "singles" ? "SINGEL" : "DOBBEL"}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          {matchType === "singles"
            ? "Trykk på spillere for å fordele. Første = Spiller 1 🟠, neste = Spiller 2 🟣"
            : "Trykk på spillere for å fordele på lag. Første 2 = Lag 1 🟠, neste 2 = Lag 2 🟣"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {inSessionPlayers.map((p) => {
            const inT1 = team1.includes(p.id);
            const inT2 = team2.includes(p.id);
            return (
              <div key={p.id} onClick={() => togglePlayer(p.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 12, cursor: "pointer",
                background: inT1 ? "#1a3a1a" : inT2 ? "#1a1a3a" : "#0a1628",
                border: `2px solid ${inT1 ? "#f97316" : inT2 ? "#6366f1" : "#1e3a5f"}`,
              }}>
                <Avatar name={p.name} size={40} colorIndex={playerIdx(p.id)} />
                <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "#f8fafc" }}>{p.name}</span>
                {inT1 && <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, color: "#f97316" }}>{matchType === "singles" ? "SPILLER 1 🟠" : "LAG 1 🟠"}</span>}
                {inT2 && <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, color: "#6366f1" }}>{matchType === "singles" ? "SPILLER 2 🟣" : "LAG 2 🟣"}</span>}
                {!inT1 && !inT2 && <span style={{ fontSize: 13, color: "#334155" }}>○</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onBack} style={{ flex: 1, height: 48, borderRadius: 12, border: "2px solid #1e3a5f", background: "none", color: "#64748b", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>← Tilbake</button>
          <button onClick={() => ready && onConfirm(team1, team2)} disabled={!ready} style={{ flex: 2, height: 48, borderRadius: 12, border: "none", background: ready ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "#1e293b", color: ready ? "#fff" : "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, cursor: ready ? "pointer" : "default" }}>
            {ready ? "Start kamp ✓" : `Velg ${(maxPerTeam * 2) - team1.length - team2.length} til`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ManagePlayersModal ────────────────────────────────────────────────────────

function ManagePlayersModal({ inSessionPlayers, notInSessionPlayers, playerName, playerIdx, addPlayerToOngoingSession, removePlayerFromSession, onAddNewPlayer, onClose }) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding]   = useState(false);

  async function handleAddNew() {
    if (!newName.trim()) return;
    setAdding(true);
    await onAddNewPlayer(newName.trim());
    setNewName("");
    setAdding(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 20, padding: 24, maxWidth: 340, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 16 }}>Endre spillere</div>

        {/* I økten nå */}
        <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>I ØKTEN NÅ</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {inSessionPlayers.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#0a1628", borderRadius: 10, border: "1px solid #1e3a5f" }}>
              <Avatar name={p.name} size={36} colorIndex={playerIdx(p.id)} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>{p.name}</span>
              <button onClick={() => removePlayerFromSession(p.id)} style={{ background: "none", border: "2px solid #7f1d1d", color: "#ef4444", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12 }}>Fjern</button>
            </div>
          ))}
        </div>

        {/* Legg til eksisterende */}
        {notInSessionPlayers.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>LEGG TIL FRA KLUBBEN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {notInSessionPlayers.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#0a1628", borderRadius: 10, border: "1px solid #1e3a5f" }}>
                  <Avatar name={p.name} size={36} colorIndex={playerIdx(p.id)} />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>{p.name}</span>
                  <button onClick={() => addPlayerToOngoingSession(p.id)} style={{ background: "none", border: "2px solid #38bdf8", color: "#38bdf8", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12 }}>+ Legg til</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Registrer ny spiller */}
        <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>REGISTRER NY SPILLER</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
            placeholder="Fullt navn..."
            style={{ flex: 1, height: 44, borderRadius: 10, border: "2px solid #1e3a5f", background: "#020617", color: "#f8fafc", fontSize: 15, padding: "0 12px", outline: "none", fontFamily: "'Barlow',sans-serif" }}
          />
          <button onClick={handleAddNew} disabled={!newName.trim() || adding} style={{ width: 44, height: 44, borderRadius: 10, background: "#38bdf8", border: "none", color: "#0f172a", fontSize: 24, fontWeight: 700, cursor: "pointer" }}>+</button>
        </div>

        <button onClick={onClose} style={{ width: "100%", height: 48, borderRadius: 12, border: "2px solid #1e3a5f", background: "none", color: "#64748b", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>← Tilbake</button>
      </div>
    </div>
  );
}

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
  discardMatch,
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
  allMatches,
  allSessions,
  postMatchChoice,
  setPostMatchChoice,
  lastSavedMatch,
  chooseAutoMatch,
  setManualMatch,
  chooseRevenge,
  onAddNewPlayer,
}) {
  const [showZeroModal, setShowZeroModal] = useState(false);
  const [pendingMatchType, setPendingMatchType] = useState("doubles");

  if (!currentMatch && !postMatchChoice) {
    return <div style={{ padding: 20, color: "#f8fafc" }}>Ingen kamp</div>;
  }

  const isZeroZero = score.t1 === 0 && score.t2 === 0;
  const isDraw     = score.t1 === score.t2 && score.t1 > 0;

  function handleSave() {
    if (isZeroZero) { setShowZeroModal(true); return; }
    if (isDraw) return;
    saveMatch();
  }

  // Finn siste kamp mellom to lag (rekkefølge og side spiller ingen rolle)
  function findLastH2H(team1ids, team2ids) {
    const a = new Set(team1ids);
    const b = new Set(team2ids);
    const sameTeam = (ids, set) =>
      ids.every(id => set.has(id)) && set.size === ids.length;

    const deletedIds = new Set((allSessions || []).filter(s => s.deleted_at).map(s => s.id));
    const allHistory = [...(allMatches || []), ...(sessionMatches || [])].filter(m => !deletedIds.has(m.session_id));
    for (let i = allHistory.length - 1; i >= 0; i--) {
      const m = allHistory[i];
      const mt1 = new Set([m.team1_p1, m.team1_p2].filter(Boolean));
      const mt2 = new Set([m.team2_p1, m.team2_p2].filter(Boolean));
      const normal   = sameTeam([...a], mt1) && sameTeam([...b], mt2);
      const reversed = sameTeam([...b], mt1) && sameTeam([...a], mt2);
      if (normal || reversed) {
        const s1 = normal ? m.score_team1 : m.score_team2;
        const s2 = normal ? m.score_team2 : m.score_team1;
        return { s1, s2 };
      }
    }
    return null;
  }

  const h2h = currentMatch ? findLastH2H(currentMatch.team1, currentMatch.team2) : null;
  const isSingles = currentMatch?.match_type === "singles";

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

      {/* ── VELG FØRSTE KAMP ──────────────────────────────────────── */}
      {postMatchChoice === "first" && (
        <MatchChoiceModal
          title="Første kamp"
          subtitle="Hvordan vil du sette opp første kamp?"
          showRevenge={false}
          playerCount={inSessionPlayers.length}
          onAuto={(matchType) => chooseAutoMatch(inSessionPlayers, matchType)}
          onManual={(matchType) => { setPendingMatchType(matchType); setPostMatchChoice("manual"); }}
          onPlayers={() => setPostMatchChoice("players")}
        />
      )}

      {/* ── VELG NESTE KAMP ───────────────────────────────────────── */}
      {postMatchChoice === "post" && (
        <MatchChoiceModal
          title="Kamp lagret! ✓"
          subtitle="Hva vil du gjøre nå?"
          showRevenge={!!lastSavedMatch}
          playerCount={inSessionPlayers.length}
          onRevenge={(matchType) => chooseRevenge(matchType)}
          onAuto={(matchType) => chooseAutoMatch(inSessionPlayers, matchType)}
          onManual={(matchType) => { setPendingMatchType(matchType); setPostMatchChoice("manual"); }}
          onPlayers={() => setPostMatchChoice("players")}
          onEnd={startEndConfirm}
        />
      )}

      {/* ── MANUELT LAG-VALG ──────────────────────────────────────── */}
      {postMatchChoice === "manual" && (
        <ManualMatchModal
          inSessionPlayers={inSessionPlayers}
          playerName={playerName}
          playerIdx={playerIdx}
          matchType={pendingMatchType}
          onConfirm={(team1, team2) => setManualMatch(team1, team2, inSessionPlayers, pendingMatchType)}
          onBack={() => setPostMatchChoice(currentMatch ? "post" : "first")}
        />
      )}

      {/* ── ENDRE SPILLERE ────────────────────────────────────────── */}
      {postMatchChoice === "players" && (
        <ManagePlayersModal
          inSessionPlayers={inSessionPlayers}
          notInSessionPlayers={notInSessionPlayers}
          playerName={playerName}
          playerIdx={playerIdx}
          addPlayerToOngoingSession={addPlayerToOngoingSession}
          removePlayerFromSession={removePlayerFromSession}
          onAddNewPlayer={onAddNewPlayer}
          onClose={() => setPostMatchChoice(currentMatch ? "post" : "first")}
        />
      )}

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
          {isSingles && <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, marginLeft: 8 }}>SINGEL</span>}
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

      {/* MAIN CONTENT — kun når kamp er satt opp */}
      {currentMatch && <div style={{ padding: 16 }}>

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

        <Card style={{ marginBottom: 14 }}>
          <div style={{ padding: "18px 18px 10px" }}>
            <Label>{isSingles ? "SPILLER 1 🟠" : "LAG 1 🟠"}</Label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {currentMatch.team1.map((id) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={playerName(id)} size={48} colorIndex={playerIdx(id)} />
                    <span style={{ fontSize: 18, fontWeight: 600 }}>{playerName(id)}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right" }}>
                {h2h ? (
                  <>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 2 }}>SISTE MØTE</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: h2h.s1 > h2h.s2 ? "#16a34a" : "#ef4444" }}>
                      {h2h.s1}–{h2h.s2}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 2 }}>FØRSTE</div>
                    <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>møte</div>
                  </>
                )}
              </div>
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
            <Label>{isSingles ? "SPILLER 2 🟣" : "LAG 2 🟣"}</Label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {currentMatch.team2.map((id) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={playerName(id)} size={48} colorIndex={playerIdx(id)} />
                    <span style={{ fontSize: 18, fontWeight: 600 }}>{playerName(id)}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right" }}>
                {h2h ? (
                  <>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 2 }}>SISTE MØTE</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: h2h.s2 > h2h.s1 ? "#16a34a" : "#ef4444" }}>
                      {h2h.s2}–{h2h.s1}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 2 }}>FØRSTE</div>
                    <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>møte</div>
                  </>
                )}
              </div>
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
              <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, marginBottom: 8 }}>{isSingles ? "SPILLER 1" : "LAG 1"}</div>
              <ScoreBig
                value={score.t1}
                onChange={(v) => setScore({ ...score, t1: v })}
                win={score.t1 > score.t2}
              />
            </div>
            <div style={{ padding: "0 12px", color: "#334155", fontSize: 28, fontWeight: 700, paddingTop: 24 }}>—</div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, marginBottom: 8 }}>{isSingles ? "SPILLER 2" : "LAG 2"}</div>
              <ScoreBig
                value={score.t2}
                onChange={(v) => setScore({ ...score, t2: v })}
                win={score.t2 > score.t1}
              />
            </div>
          </div>
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
          {[...sessionMatches].reverse().map((m, i) => {
            const isSinglesMatch = m.match_type === "singles";
            return (
              <div key={m.id ?? i} style={{
                display: "grid", gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center", padding: "8px 0",
                borderBottom: i < sessionMatches.length - 1 ? "1px solid #1e293b" : "none",
                fontSize: 13, color: "#94a3b8", gap: 8,
              }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isSinglesMatch
                    ? playerName(m.team1_p1)
                    : `${playerName(m.team1_p1)}/${playerName(m.team1_p2)}`}
                </span>
                <span style={{ fontWeight: 700, color: "#f8fafc", whiteSpace: "nowrap", textAlign: "center" }}>
                  {m.score_team1}–{m.score_team2}
                  {isSinglesMatch && <span style={{ fontSize: 10, color: "#a78bfa", marginLeft: 4 }}>S</span>}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                  {isSinglesMatch
                    ? playerName(m.team2_p1)
                    : `${playerName(m.team2_p1)}/${playerName(m.team2_p2)}`}
                </span>
              </div>
            );
          })}
        </Card>

      </div>
      } {/* end currentMatch */}
    </>
  );
}
