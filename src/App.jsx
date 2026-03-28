// src/App.jsx

import { useState, useEffect } from "react";
import supabase from "./logic/supabase";
import { useSession } from "./hooks/useSession";
import { computeStats } from "./logic/stats";

import Toast   from "./components/Toast";

import Home          from "./screens/Home";
import Session       from "./screens/Session";
import Stats         from "./screens/Stats";
import SessionDetail from "./screens/SessionDetail";

import "./styles/layout.css";
import { computeFunStats } from "./logic/funStats";
import DailyStatsPopup from "./components/DailyStatsPopup";

export default function App() {
  // ── Navigasjon ──
  const [screen, setScreen]           = useState("home");
  const [statsTab, setStatsTab]       = useState("session");
  const [detailSession, setDetailSession] = useState(null);

  // ── Daglig popup ──
  const [showDailyStats, setShowDailyStats] = useState(false);

  const handleCloseDailyStats = () => {
    localStorage.setItem("lastDailyStats", new Date().toDateString());
    setShowDailyStats(false);
  };

  useEffect(() => {
    const last = localStorage.getItem("lastDailyStats");
    const today = new Date().toDateString();
    if (last !== today) setShowDailyStats(true);
  }, []);

  // ── Spillere ──
  const [players, setPlayers] = useState([]);
  const [newName, setNewName] = useState("");

  // ── Økt-hook ──
  const sess = useSession(players);

  // ── Avledede verdier ──
  const activePlayers       = players.filter((p) => sess.checkedIn.includes(p.id));
  const notInSessionPlayers = players.filter((p) => !sess.checkedIn.includes(p.id));
  const playerName          = (id) => players.find((p) => p.id === id)?.name || "?";
  const playerIdx           = (id) => players.findIndex((p) => p.id === id);

  // ── Init ──
  useEffect(() => {
    loadPlayers();
    sess.loadAll();
    const ch = supabase
      .channel("players-ch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        loadPlayers
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function loadPlayers() {
    const { data } = await supabase.from("players").select("*").order("name");
    if (data) setPlayers(data);
  }

  async function addPlayer() {
    const name = newName.trim();
    if (!name) return;
    const { error } = await supabase.from("players").insert({ name });
    if (error) sess.showToast("Feil ved lagring", "error");
    else {
      setNewName("");
      sess.showToast(`${name} lagt til ✓`, "success");
    }
  }

  async function removePlayer(id) {
    await supabase.from("players").delete().eq("id", id);
    sess.setCheckedIn((prev) => prev.filter((x) => x !== id));
  }

  // ── Handlinger med skjermbytte ──
  async function handleStartSession() {
    const ok = await sess.startSession(activePlayers);
    if (ok) setScreen("session");
  }

  async function handleEndSession() {
    const ok = await sess.endSession();
    if (ok) setScreen("home");
  }

  // ── Avslutt-modal ──
  const EndConfirmModal = () => (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#0f172a",
          border: "2px solid #334155",
          borderRadius: 20,
          padding: 28,
          maxWidth: 340,
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 22, fontWeight: 800,
            color: "#f8fafc", marginBottom: 10,
          }}
        >
          Avslutt økt?
        </div>
        <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>
          Økten har {sess.sessionMatches.length} kamper registrert. Den vil lagres i historikken.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => sess.setShowEndConfirm(false)}
            style={{
              flex: 1, height: 50, borderRadius: 14, border: "2px solid #1e3a5f",
              background: "none", color: "#94a3b8",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}
          >
            Avbryt
          </button>
          <button
            onClick={handleEndSession}
            style={{
              flex: 1, height: 58, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg,#d97706,#b45309)",
              color: "#fff",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 800, fontSize: 18, cursor: "pointer",
            }}
          >
            Avslutt økt
          </button>
        </div>
      </div>
    </div>
  );

  // ── RENDER ──
  const funStats = computeFunStats(sess.allMatches, sess.allSessions, players);

  return (
    <div>
      <Toast toast={sess.toast} />
      {sess.showEndConfirm && <EndConfirmModal />}
      {showDailyStats && (
        <DailyStatsPopup stats={funStats} onClose={handleCloseDailyStats} />
      )}

      {screen === "home" && (
        <Home
          players={players}
          newName={newName}
          setNewName={setNewName}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          checkedIn={sess.checkedIn}
          toggleCheckIn={(id) =>
            sess.setCheckedIn((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          startSession={handleStartSession}
          loading={sess.loading}
          goToStats={() => { setStatsTab("total"); setScreen("stats"); }}
        />
      )}

      {screen === "session" && (
        <Session
          currentMatch={sess.currentMatch}
          matchNumber={sess.matchNumber}
          score={sess.score}
          setScore={sess.setScore}
          playerName={playerName}
          playerIdx={playerIdx}
          sessionMatches={sess.sessionMatches}
          undoLast={() => sess.undoLast(activePlayers)}
          saveMatch={() => sess.saveMatch(activePlayers)}
          loading={sess.loading}
          setScreen={setScreen}
          setStatsTab={setStatsTab}
          startEndConfirm={() => sess.setShowEndConfirm(true)}
          showAddPlayers={sess.showAddPlayers}
          setShowAddPlayers={sess.setShowAddPlayers}
          notInSessionPlayers={notInSessionPlayers}
          addPlayerToOngoingSession={(id) =>
            sess.addPlayerToOngoingSession(id, playerName(id))
          }
        />
      )}

      {screen === "stats" && (
        <Stats
          session={sess.session}
          statsTab={statsTab}
          setStatsTab={setStatsTab}
          sessionStats={sess.sessionStats}
          totalStats={sess.totalStats}
          sessionList={sess.sessionList}
          allSessions={sess.allSessions}
          playerName={playerName}
          setDetailSession={setDetailSession}
          setScreen={setScreen}
          restoreSession={sess.restoreSession}
        />
      )}

      {screen === "sessionDetail" && (
        <SessionDetail
          detailSession={detailSession}
          playerName={playerName}
          computeStats={computeStats}
          softDeleteSession={async (id) => {
            await sess.softDeleteSession(id);
            setScreen("stats");
          }}
          setScreen={setScreen}
        />
      )}
    </div>
  );
}
