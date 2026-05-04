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

import NewSession    from "./screens/NewSession";
import Admin         from "./screens/Admin";
import Session       from "./screens/Session";
import Stats         from "./screens/Stats";
import SessionDetail from "./screens/SessionDetail";

import "./styles/layout.css";
import { computeFunStats } from "./logic/funStats";
import DailyStatsPopup from "./components/DailyStatsPopup";

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────

const TABS = [
  { id: "session",  label: "Ny økt",      icon: "🏸" },
  { id: "stats",    label: "Statistikk",  icon: "📊" },
  { id: "players",  label: "Spillere",    icon: "👥" },
  { id: "admin",    label: "Innstillinger", icon: "⚙️" },
];

function BottomTabBar({ activeTab, onSelect }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      zIndex: 100,
      display: "flex",
      justifyContent: "center",
      background: "#0a1628",
      borderTop: "1px solid #1e3a5f",
    }}>
    <div style={{
      width: "100%",
      maxWidth: 480,
      display: "flex",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "10px 0 8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: active ? "#38bdf8" : "#475569",
              transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: active ? 700 : 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              {tab.label}
            </span>
            {active && (
              <div style={{
                position: "absolute",
                top: 0,
                width: 32,
                height: 2,
                background: "#38bdf8",
                borderRadius: "0 0 2px 2px",
              }} />
            )}
          </button>
        );
      })}
    </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const auth = useAuth();
  const [clubSearch, setClubSearch] = useState("");

  const [activeTab, setActiveTab]         = useState("session"); // default tab
  const [screen, setScreen]               = useState(null);      // "session" | "sessionDetail" | null
  const [statsTab, setStatsTab]           = useState("total");
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

  const activePlayers       = players.filter((p) => sess.checkedIn.includes(p.id));
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

  // Naviger til spillere-fanen kun hvis ingen spillere etter lasting
  const [playersLoaded, setPlayersLoaded] = useState(false);

  useEffect(() => {
    if (auth.authState !== "app") return;
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("club_id", auth.club?.id)
      .or("hidden.is.null,hidden.eq.false")
      .then(({ count }) => {
        setPlayersLoaded(true);
        if (count === 0) setActiveTab("players");
      });
  }, [auth.authState]);

  async function loadPlayers() {
    if (!auth.club) return;
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("club_id", auth.club.id)
      .or("hidden.is.null,hidden.eq.false")
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
    if (error) { sess.showToast("Feil ved lagring av navn", "error"); return; }
    await loadPlayers();
    sess.showToast("Navn oppdatert ✓", "success");
  }

  const [nextTraining, setNextTraining] = useState(null);

  useEffect(() => {
    if (auth.club?.next_training) setNextTraining(auth.club.next_training);
  }, [auth.club?.next_training]);

  async function saveNextTraining(datetime) {
    if (!auth.club) return;
    const iso = new Date(datetime).toISOString();
    const { error } = await supabase
      .from("clubs")
      .update({ next_training: iso })
      .eq("id", auth.club.id);
    if (error) { sess.showToast("Feil ved lagring av treningsdato", "error"); return; }
    setNextTraining(iso);
    const updatedClub = { ...auth.club, next_training: iso };
    localStorage.setItem("badminton_club", JSON.stringify(updatedClub));
    sess.showToast("Treningsdato lagret ✓", "success");
  }

  async function removePlayer(id) {
    const { error } = await supabase
      .from("players")
      .update({ hidden: true })
      .eq("id", id);
    if (error) { sess.showToast("Feil ved fjerning av spiller", "error"); return; }
    sess.setCheckedIn((prev) => prev.filter((x) => x !== id));
    await loadPlayers();
    sess.showToast("Spiller fjernet ✓", "info");
  }

  const [trainingDefaults, setTrainingDefaults] = useState([]);

  useEffect(() => {
    if (auth.authState !== "app" || !auth.club) return;
    loadTrainingDefaults();
  }, [auth.authState, auth.club?.id]);

  async function loadTrainingDefaults() {
    if (!auth.club) return;
    const { data } = await supabase
      .from("training_defaults")
      .select("*")
      .eq("club_id", auth.club.id)
      .order("day_of_week");
    if (data) setTrainingDefaults(data);
  }

  async function addTrainingDefault(day_of_week, start_time) {
    if (!auth.club) return;
    const { error } = await supabase
      .from("training_defaults")
      .insert({ club_id: auth.club.id, day_of_week, start_time });
    if (error) { sess.showToast("Feil ved lagring", "error"); return; }
    await loadTrainingDefaults();
    sess.showToast("Treningsdag lagt til ✓", "success");
  }

  async function updateTrainingDefault(id, day_of_week, start_time) {
    const { error } = await supabase
      .from("training_defaults")
      .update({ day_of_week, start_time })
      .eq("id", id);
    if (error) { sess.showToast("Feil ved oppdatering", "error"); return; }
    await loadTrainingDefaults();
    sess.showToast("Treningsdag oppdatert ✓", "success");
  }

  async function deleteTrainingDefault(id) {
    const { error } = await supabase
      .from("training_defaults")
      .delete()
      .eq("id", id);
    if (error) { sess.showToast("Feil ved sletting", "error"); return; }
    await loadTrainingDefaults();
    sess.showToast("Treningsdag fjernet ✓", "info");
  }

  async function saveClubName(name) {
    if (!auth.club) return;
    const { error } = await supabase
      .from("clubs").update({ name }).eq("id", auth.club.id);
    if (error) { sess.showToast("Feil ved lagring av navn", "error"); return; }
    const updatedClub = { ...auth.club, name };
    localStorage.setItem("badminton_club", JSON.stringify(updatedClub));
    auth.club.name = name;
    sess.showToast("Klubbnavn oppdatert ✓", "success");
  }

  async function savePin(pin) {
    if (!auth.club) return;
    const { error } = await supabase
      .from("clubs").update({ pin }).eq("id", auth.club.id);
    if (error) { sess.showToast("Feil ved lagring av PIN", "error"); return; }
    sess.showToast("PIN oppdatert ✓", "success");
  }

  async function handleStartSession() {
    const ok = await sess.startSession(activePlayers);
    if (ok) setScreen("session");
  }

  async function handleEndSession() {
    const ok = await sess.endSession();
    if (ok) setScreen(null);
  }

  async function handleLogout() {
    await auth.logout();
    setPlayers([]);
    setNewName("");
    setScreen(null);
    setActiveTab("session");
  }

  const EndConfirmModal = () => (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
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

  // Pågående økt-skjerm tar over hele grensesnittet
  if (screen === "session") return (
    <div>
      <Toast toast={sess.toast} />
      {sess.showEndConfirm && <EndConfirmModal />}
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
        notInSessionPlayers={notInSessionPlayers}
        addPlayerToOngoingSession={(id) =>
          sess.addPlayerToOngoingSession(id, playerName(id), activePlayers)
        }
        inSessionPlayers={activePlayers}
        removePlayerFromSession={(id) =>
          sess.removePlayerFromSession(
            id, playerName(id), activePlayers,
            sess.currentMatch, sess.matchHistory,
          )
        }
        allMatches={sess.allMatches}
        allSessions={sess.allSessions}
        postMatchChoice={sess.postMatchChoice}
        setPostMatchChoice={sess.setPostMatchChoice}
        lastSavedMatch={sess.lastSavedMatch}
        chooseAutoMatch={() => sess.chooseAutoMatch(activePlayers)}
        setManualMatch={(t1, t2) => sess.setManualMatch(t1, t2, activePlayers)}
        chooseRevenge={sess.chooseRevenge}
        onAddNewPlayer={async (name) => {
          if (!auth.club) return;
          const { data, error } = await supabase.from("players").insert({ name, club_id: auth.club.id }).select().single();
          if (error) { sess.showToast("Feil ved lagring", "error"); return; }
          await loadPlayers();
          sess.addPlayerToOngoingSession(data.id, name, activePlayers);
        }}
      />
    </div>
  );



  // ── HOVED-APP MED TABS ────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 70 }}>
      <Toast toast={sess.toast} />
      {sess.showEndConfirm && <EndConfirmModal />}
      {showDailyStats && (
        <DailyStatsPopup stats={funStats} onClose={handleCloseDailyStats} />
      )}

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
        padding: "28px 20px 16px",
        borderBottom: "1px solid #1e3a5f",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: auth.club?.color || "#38bdf8",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 16, color: "#fff",
          fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0,
        }}>
          {auth.club ? auth.club.name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "🏸"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 20, fontWeight: 800, lineHeight: 1,
            color: auth.club?.color || "#38bdf8", letterSpacing: "0.02em",
          }}>
            {auth.club?.name || "BADMINTON"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.1em", marginTop: 2 }}>
            TRENINGSAPP
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: "none", border: "none", color: "#475569",
          fontSize: 13, cursor: "pointer", fontFamily: "'Barlow',sans-serif",
          padding: "4px 8px",
        }}>
          Logg ut
        </button>
      </div>

      {/* Tab-innhold */}
      {activeTab === "session" && (
        <NewSession
          players={players}
          checkedIn={sess.checkedIn}
          toggleCheckIn={(id) =>
            sess.setCheckedIn((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          startSession={handleStartSession}
          loading={sess.loading}
        />
      )}

      {activeTab === "stats" && !detailSession && (
        <Stats
          session={null}
          statsTab={statsTab} setStatsTab={setStatsTab}
          sessionStats={sess.sessionStats}
          totalStats={sess.totalStats}
          sessionList={sess.sessionList}
          allSessions={sess.allSessions}
          allMatches={sess.allMatches}
          players={players}
          playerName={playerName}
          setDetailSession={setDetailSession}
          setScreen={setScreen}
          restoreSession={sess.restoreSession}
          hideSession={sess.hideSession}
        />
      )}

      {activeTab === "stats" && detailSession && (
        <SessionDetail
          detailSession={detailSession}
          playerName={playerName} players={players}
          computeStats={computeStats}
          softDeleteSession={async (id) => {
            await sess.softDeleteSession(id);
            setDetailSession(null);
          }}
          setScreen={() => setDetailSession(null)}
        />
      )}

      {activeTab === "players" && (
        <PlayersTab
          players={players}
          newName={newName} setNewName={setNewName}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          renamePlayer={renamePlayer}
          showToast={sess.showToast}
        />
      )}

      {activeTab === "admin" && (
        <Admin
          push={push}
          club={auth.club}
          nextTraining={nextTraining}
          onSaveTraining={saveNextTraining}
          onSaveClubName={saveClubName}
          onSavePin={savePin}
          trainingDefaults={trainingDefaults}
          onAddTrainingDefault={addTrainingDefault}
          onUpdateTrainingDefault={updateTrainingDefault}
          onDeleteTrainingDefault={deleteTrainingDefault}
        />
      )}

      <BottomTabBar activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  );
}

// ── Spillere-tab (inline, liten komponent) ────────────────────────────────────

function PlayersTab({ players, newName, setNewName, addPlayer, removePlayer, renamePlayer }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editPlayer, setEditPlayer]       = useState(null);
  const [editName, setEditName]           = useState("");

  return (
    <div style={{ padding: "20px 16px" }}>

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%" }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>Fjern spiller?</div>
            <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 6 }}>
              <strong style={{ color: "#f8fafc" }}>{confirmDelete.name}</strong> skjules fra spillerlisten.
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>Statistikk og kamphistorikk beholdes.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, height: 50, borderRadius: 14, border: "2px solid #1e3a5f", background: "none", color: "#94a3b8", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Avbryt</button>
              <button onClick={() => { removePlayer(confirmDelete.id); setConfirmDelete(null); }} style={{ flex: 1, height: 50, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Fjern</button>
            </div>
          </div>
        </div>
      )}

      {editPlayer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#0f172a", border: "2px solid #334155", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%" }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 16 }}>Endre navn</div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editName.trim()) { renamePlayer(editPlayer.id, editName.trim()); setEditPlayer(null); }
                if (e.key === "Escape") setEditPlayer(null);
              }}
              autoFocus
              style={{ width: "100%", height: 52, borderRadius: 12, border: "2px solid #38bdf8", background: "#0f172a", color: "#f8fafc", fontSize: 18, padding: "0 16px", outline: "none", fontFamily: "'Barlow',sans-serif", boxSizing: "border-box", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditPlayer(null)} style={{ flex: 1, height: 50, borderRadius: 14, border: "2px solid #1e3a5f", background: "none", color: "#94a3b8", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Avbryt</button>
              <button onClick={() => { if (editName.trim()) { renamePlayer(editPlayer.id, editName.trim()); setEditPlayer(null); } }} disabled={!editName.trim()} style={{ flex: 1, height: 50, borderRadius: 14, border: "none", background: editName.trim() ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "#1e293b", color: editName.trim() ? "#fff" : "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, cursor: editName.trim() ? "pointer" : "default" }}>Lagre</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 10 }}>LEGG TIL SPILLER</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPlayer()}
          placeholder="Fullt navn..."
          style={{ flex: 1, height: 54, borderRadius: 12, border: "2px solid #1e3a5f", background: "#0f172a", color: "#f8fafc", fontSize: 16, padding: "0 16px", outline: "none", fontFamily: "'Barlow',sans-serif" }}
        />
        <button onClick={addPlayer} style={{ width: 54, height: 54, borderRadius: 12, background: "#38bdf8", border: "none", color: "#0f172a", fontSize: 28, fontWeight: 700, cursor: "pointer" }}>+</button>
      </div>

      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 10 }}>SPILLERE ({players.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 14, background: "#0f172a", border: "2px solid #1e3a5f" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${i * 47 % 360},60%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0 }}>
              {p.name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, flex: 1, color: "#f8fafc" }}>{p.name}</span>
            <button onClick={() => { setEditPlayer(p); setEditName(p.name); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>✏️</button>
            <button onClick={() => setConfirmDelete(p)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 22, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
          </div>
        ))}
        {players.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>
              Velkommen til klubben!
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Start med å legge til spillerne nedenfor
            </div>
          </div>
        )}
        {players.length === 0 && (
          <div style={{ color: "#334155", textAlign: "center", padding: "8px 0" }}>Ingen spillere ennå</div>
        )}
      </div>
    </div>
  );
}
