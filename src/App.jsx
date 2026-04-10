// src/App.jsx

import { useState, useEffect } from "react";
import supabase from "./logic/supabase";
import { useAuth } from "./hooks/useAuth";
import { usePush } from "./hooks/usePush";
import { useSession } from "./hooks/useSession";
import { computeStats } from "./logic/stats";

import Toast from "./components/Toast";

import ClubSelect  from "./screens/ClubSelect";
import PinScreen   from "./screens/PinScreen";
import CreateClub  from "./screens/CreateClub";

import Home          from "./screens/Home";
import Session       from "./screens/Session";
import Stats         from "./screens/Stats";
import SessionDetail from "./screens/SessionDetail";

import "./styles/layout.css";
import { computeFunStats } from "./logic/funStats";
import DailyStatsPopup from "./components/DailyStatsPopup";

export default function App() {
  const auth = useAuth();
  const [clubSearch, setClubSearch] = useState("");

  const [screen, setScreen]               = useState("home");
  const [statsTab, setStatsTab]           = useState("session");
  const [detailSession, setDetailSession] = useState(null);

  const [showDailyStats, setShowDailyStats] = useState(false);
  const handleCloseDailyStats = () => {
    localStorage.setItem("lastDailyStats", new Date().toDateString());
    setShowDailyStats(false);
  };
  useEffect(() => {
    const last  = localStorage.getItem("lastDailyStats");
    const today = new Date().toDateString();
    if (last !== today) setShowDailyStats(true);
  }, []);

  const [players, setPlayers] = useState([]);
  const [newName, setNewName] = useState("");

  const sess = useSession(players, auth.club);
  const push = usePush(auth.club);

  // Spillere som er med i økten nå
  const activePlayers       = players.filter((p) => sess.checkedIn.includes(p.id));
  // Spillere som ikke er med i økten
  const notInSessionPlayers = players.filter((p) => !sess.checkedIn.includes(p.id));
  const playerName          = (id) => players.find((p) => p.id === id)?.name || "?";
  const playerIdx           = (id) => players.findIndex((p) => p.id === id);

  useEffect(() => {
    if (auth.authState !== "app" || !auth.club) return;
    loadPlayers();
    sess.loadAll();
    const ch = supabase
      .channel("players-ch")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "players" },
        loadPlayers)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [auth.authState, auth.club?.id]);

  async function loadPlayers() {
    if (!auth.club) return;
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("club_id", auth.club.id)
      .or("hidden.is.null,hidden.eq.false")  // filtrer bort skjulte spillere (null = ikke satt)
      .order("name");
    if (data) setPlayers(data);
  }

  async function addPlayer() {
    const name = newName.trim();
    if (!name || !auth.club) return;
    const { error } = await supabase
      .from("players").insert({ name, club_id: auth.club.id });
    if (error) sess.showToast("Feil ved lagring", "error");
    else { setNewName(""); sess.showToast(`${name} lagt til ✓`, "success"); }
  }

  async function renamePlayer(id, newName) {
    const { error } = await supabase
      .from("players")
      .update({ name: newName })
      .eq("id", id);
    if (error) {
      sess.showToast("Feil ved lagring av navn", "error");
      return;
    }
    await loadPlayers();
    sess.showToast("Navn oppdatert ✓", "success");
  }

  const [nextTraining, setNextTraining] = useState(auth.club?.next_training || null);

  async function saveNextTraining(datetime) {
    if (!auth.club) return;
    const iso = new Date(datetime).toISOString();
    const { error } = await supabase
      .from("clubs")
      .update({ next_training: iso })
      .eq("id", auth.club.id);
    if (error) { sess.showToast("Feil ved lagring av treningsdato", "error"); return; }
    // Oppdater lokal state og localStorage
    setNextTraining(iso);
    const updatedClub = { ...auth.club, next_training: iso };
    localStorage.setItem("badminton_club", JSON.stringify(updatedClub));
    sess.showToast("Treningsdato lagret ✓", "success");
  }

  async function removePlayer(id) {
    // Soft delete — skjuler spilleren uten å slette kampdata
    const { error } = await supabase
      .from("players")
      .update({ hidden: true })
      .eq("id", id);
    if (error) {
      sess.showToast("Feil ved fjerning av spiller", "error");
      console.error("removePlayer error:", error);
      return;
    }
    sess.setCheckedIn((prev) => prev.filter((x) => x !== id));
    // Last spillere på nytt eksplisitt så listen oppdateres umiddelbart
    await loadPlayers();
    sess.showToast("Spiller fjernet ✓", "info");
  }

  async function handleStartSession() {
    const ok = await sess.startSession(activePlayers);
    if (ok) setScreen("session");
  }

  async function handleEndSession() {
    const ok = await sess.endSession();
    if (ok) setScreen("home");
  }

  async function handleLogout() {
    await auth.logout();
    setPlayers([]);
    setNewName("");
    setScreen("home");
  }

  const EndConfirmModal = () => (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 10 }}>
          Avslutt økt?
        </div>
        <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>
          Økten har {sess.sessionMatches.length} kamper registrert. Den vil lagres i historikken.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => sess.setShowEndConfirm(false)}
            style={{ flex: 1, height: 50, borderRadius: 14, border: "2px solid #1e3a5f", background: "none", color: "#94a3b8", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
          >
            Avbryt
          </button>
          <button
            onClick={handleEndSession}
            style={{ flex: 1, height: 58, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#d97706,#b45309)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, cursor: "pointer" }}
          >
            Avslutt økt
          </button>
        </div>
      </div>
    </div>
  );

  // ── AUTH-SKJERMER ─────────────────────────────────────────────────────────

  if (auth.authState === "loading") return (
    <div style={{ minHeight: "100dvh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <span style={{ fontSize: 48 }}>🏸</span>
      <div style={{ color: "#475569", fontSize: 15, fontFamily: "'Barlow',sans-serif" }}>Laster...</div>
    </div>
  );

  if (auth.authState === "clubs") return (
    <ClubSelect
      clubs={auth.clubs} clubSearch={clubSearch} setClubSearch={setClubSearch}
      onSelect={auth.selectClub} onCreateNew={() => auth.setAuthState("create")}
    />
  );

  if (auth.authState === "pin") return (
    <PinScreen
      club={auth.club} onSubmit={auth.submitPin}
      onBack={() => auth.setAuthState("clubs")}
      pinError={auth.pinError} loading={auth.loading}
    />
  );

  if (auth.authState === "create") return (
    <CreateClub
      newClubName={auth.newClubName}   setNewClubName={auth.setNewClubName}
      newClubPin={auth.newClubPin}     setNewClubPin={auth.setNewClubPin}
      newClubPin2={auth.newClubPin2}   setNewClubPin2={auth.setNewClubPin2}
      newClubEmail={auth.newClubEmail} setNewClubEmail={auth.setNewClubEmail}
      newClubColor={auth.newClubColor} setNewClubColor={auth.setNewClubColor}
      createClub={auth.createClub} loading={auth.loading}
      onBack={() => auth.setAuthState("clubs")} showToast={sess.showToast}
    />
  );

  // ── APP ───────────────────────────────────────────────────────────────────

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
          newName={newName} setNewName={setNewName}
          addPlayer={addPlayer} removePlayer={removePlayer} renamePlayer={renamePlayer}
          checkedIn={sess.checkedIn}
          toggleCheckIn={(id) =>
            sess.setCheckedIn((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          startSession={handleStartSession}
          loading={sess.loading}
          goToStats={() => { setStatsTab("total"); setScreen("stats"); }}
          club={auth.club}
          onLogout={handleLogout}
          push={push}
          nextTraining={nextTraining}
          onSaveTraining={saveNextTraining}
        />
      )}

      {screen === "session" && (
        <Session
          currentMatch={sess.currentMatch}
          matchNumber={sess.matchNumber}
          score={sess.score} setScore={sess.setScore}
          playerName={playerName} playerIdx={playerIdx}
          sessionMatches={sess.sessionMatches}
          undoLast={() => sess.undoLast(activePlayers)}
          saveMatch={() => sess.saveMatch(activePlayers)}
          discardMatch={() => sess.discardMatch(activePlayers)}
          loading={sess.loading}
          setScreen={setScreen} setStatsTab={setStatsTab}
          startEndConfirm={() => sess.setShowEndConfirm(true)}
          showAddPlayers={sess.showAddPlayers}
          setShowAddPlayers={sess.setShowAddPlayers}
          // Legg til
          notInSessionPlayers={notInSessionPlayers}
          addPlayerToOngoingSession={(id) =>
            sess.addPlayerToOngoingSession(id, playerName(id), activePlayers)
          }
          // Fjern — sender med nødvendig snapshot-data
          inSessionPlayers={activePlayers}
          removePlayerFromSession={(id) =>
            sess.removePlayerFromSession(
              id,
              playerName(id),
              activePlayers,
              sess.currentMatch,
              sess.matchHistory,
            )
          }
        />
      )}

      {screen === "stats" && (
        <Stats
          session={sess.session}
          statsTab={statsTab} setStatsTab={setStatsTab}
          sessionStats={sess.sessionStats}
          totalStats={sess.totalStats}
          sessionList={sess.sessionList}
          allSessions={sess.allSessions}
          playerName={playerName}
          setDetailSession={setDetailSession}
          setScreen={setScreen}
          restoreSession={sess.restoreSession}
          hideSession={sess.hideSession}
        />
      )}

      {screen === "sessionDetail" && (
        <SessionDetail
          detailSession={detailSession}
          playerName={playerName} players={players}
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
