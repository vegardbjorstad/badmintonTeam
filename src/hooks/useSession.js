// src/hooks/useSession.js

import { useState, useEffect, useRef } from "react";
import supabase from "../logic/supabase";
import generateNextMatch from "../logic/matchGenerator";
import { computeStats } from "../logic/stats";

/**
 * useSession
 * ----------
 * Samler all tilstand og logikk for én badminton-økt.
 * Returnerer alt App.jsx trenger for å rendre skjermene.
 */
export function useSession(players) {
  // ── Pågående økt ──
  const [session, setSession]               = useState(null);
  const [matchHistory, setMatchHistory]     = useState([]);
  const [waitingQueue, setWaitingQueue]     = useState([]);
  const [currentMatch, setCurrentMatch]     = useState(null);
  const [matchNumber, setMatchNumber]       = useState(1);
  const [score, setScore]                   = useState({ t1: 0, t2: 0 });
  const [sessionMatches, setSessionMatches] = useState([]);

  // ── Data fra DB ──
  const [allSessions, setAllSessions] = useState([]);
  const [allMatches, setAllMatches]   = useState([]);
  const [allPauses, setAllPauses]     = useState([]);

  // ── UI-tilstand ──
  const [loading, setLoading]               = useState(false);
  const [toast, setToast]                   = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showAddPlayers, setShowAddPlayers] = useState(false);
  const [checkedIn, setCheckedIn]           = useState([]);
  const toastTimer = useRef(null);

  // ── Toast-hjelper ──
  const showToast = (msg, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  // ── Realtime-abonnement på sessions-matches ──
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`sess-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `session_id=eq.${session.id}`,
        },
        () => loadSessionMatches(session.id)
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session]);

  // ── DB-lasting ──
  async function loadAll() {
    const [
      { data: sessions },
      { data: matches },
      { data: pauses },
    ] = await Promise.all([
      supabase.from("sessions").select("*").order("date", { ascending: false }),
      supabase.from("matches").select("*"),
      supabase.from("match_pauses").select("*"),
    ]);
    if (sessions) setAllSessions(sessions);
    if (matches)  setAllMatches(matches);
    if (pauses)   setAllPauses(pauses);
  }

  async function loadSessionMatches(sessionId) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("session_id", sessionId)
      .order("match_number");
    if (data) setSessionMatches(data);
  }

  // ── Start økt ──
  async function startSession(activePlayers) {
    if (checkedIn.length < 4) {
      showToast("Minst 4 spillere!", "error");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ date: new Date().toISOString().slice(0, 10) })
      .select()
      .single();
    setLoading(false);
    if (error || !data) {
      showToast("Kunne ikke starte økt", "error");
      return;
    }
    setSession(data);
    setMatchHistory([]);
    setWaitingQueue([]);
    setMatchNumber(1);
    setSessionMatches([]);
    const match = generateNextMatch(activePlayers, [], []);
    setCurrentMatch(match);
    setWaitingQueue(match?.sitting || []);
    setScore({ t1: 0, t2: 0 });
    return true; // signal til App om å bytte skjerm
  }

  // ── Avslutt økt ──
  async function endSession() {
    setShowEndConfirm(false);
    await supabase
      .from("sessions")
      .update({ note: `Avsluttet – ${sessionMatches.length} kamper` })
      .eq("id", session.id);
    await loadAll();
    setSession(null);
    setCurrentMatch(null);
    setSessionMatches([]);
    setMatchHistory([]);
    setCheckedIn([]);
    showToast("Økt avsluttet ✓", "success");
    return true; // signal til App om å bytte skjerm
  }

  // ── Lagre kamp ──
  async function saveMatch(activePlayers) {
    if (!currentMatch || !session) return;
    const { team1, team2 } = currentMatch;
    const winner = score.t1 > score.t2 ? 1 : 2;
    setLoading(true);
    const { data: savedMatch, error } = await supabase
      .from("matches")
      .insert({
        session_id: session.id,
        match_number: matchNumber,
        team1_p1: team1[0], team1_p2: team1[1],
        team2_p1: team2[0], team2_p2: team2[1],
        score_team1: score.t1, score_team2: score.t2,
        winner,
      })
      .select()
      .single();
    if (error || !savedMatch) {
      setLoading(false);
      showToast("Feil ved lagring", "error");
      return;
    }
    if (currentMatch.sitting.length > 0) {
      await supabase.from("match_pauses").insert(
        currentMatch.sitting.map((pid) => ({
          match_id: savedMatch.id,
          player_id: pid,
          session_id: session.id,
        }))
      );
    }
    setLoading(false);
    loadAll();
    const newHistory = [...matchHistory, { team1, team2 }];
    setMatchHistory(newHistory);
    setMatchNumber((n) => n + 1);
    showToast("Kamp lagret ✓", "success");
    const next = generateNextMatch(activePlayers, newHistory, currentMatch.sitting);
    setCurrentMatch(next);
    setWaitingQueue(next?.sitting || []);
    setScore({ t1: 0, t2: 0 });
  }

  // ── Angre siste kamp ──
  async function undoLast(activePlayers) {
    if (sessionMatches.length === 0) {
      showToast("Ingen kamp å angre", "error");
      return;
    }
    const last = sessionMatches[sessionMatches.length - 1];
    setLoading(true);
    await supabase.from("matches").delete().eq("id", last.id);
    setLoading(false);
    const newHistory = matchHistory.slice(0, -1);
    setMatchHistory(newHistory);
    setMatchNumber((n) => Math.max(1, n - 1));
    loadAll();
    loadSessionMatches(session.id);
    showToast("Angret ✓", "info");
    setCurrentMatch(generateNextMatch(activePlayers, newHistory, waitingQueue));
    setScore({ t1: 0, t2: 0 });
  }

  // ── Legg til spiller underveis ──
  function addPlayerToOngoingSession(playerId, playerName) {
    setCheckedIn((prev) => [...prev, playerId]);
    setWaitingQueue((prev) => [...prev, playerId]);
    showToast(`${playerName} lagt til i økta ✓`, "success");
  }

  // ── Slett økt (soft delete) ──
  async function softDeleteSession(sessionId) {
    const { error } = await supabase
      .from("sessions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) {
      showToast("Feil: klarte ikke å slette økten", "error");
      return;
    }
    await loadAll();
    showToast("Økt flyttet til arkiv", "warning");
  }

  // ── Gjenopprett økt ──
  async function restoreSession(sessionId) {
    await supabase
      .from("sessions")
      .update({ deleted_at: null })
      .eq("id", sessionId);
    await loadAll();
    showToast("Økt gjenopprettet ✓", "success");
  }

  // ── Avledede verdier ──
  const sessionPauses = allPauses.filter((p) => p.session_id === session?.id);
  const sessionStats  = computeStats(sessionMatches, sessionPauses, players);

  const activeMatches = allMatches.filter((m) => {
    const s = allSessions.find((s) => s.id === m.session_id);
    return !s?.deleted_at;
  });
  const activePauses = allPauses.filter((p) => {
    const s = allSessions.find((s) => s.id === p.session_id);
    return !s?.deleted_at;
  });
  const totalStats = computeStats(activeMatches, activePauses, players);

  const sessionList = allSessions
    .filter((s) => !s.deleted_at)
    .map((s) => {
      const sMatches = allMatches.filter((m) => m.session_id === s.id);
      const sPauses  = allPauses.filter((p) => p.session_id === s.id);
      const participantIds = [
        ...new Set(
          sMatches.flatMap((m) => [
            m.team1_p1, m.team1_p2,
            m.team2_p1, m.team2_p2,
          ])
        ),
      ];
      return { ...s, matchCount: sMatches.length, participantIds, sMatches, sPauses };
    })
    .filter((s) => s.matchCount > 0);

  return {
    // Økt-tilstand
    session, setSession,
    matchHistory, waitingQueue,
    currentMatch, matchNumber,
    score, setScore,
    sessionMatches,
    // DB-data
    allSessions, allMatches, allPauses,
    // UI
    loading, toast, showToast,
    showEndConfirm, setShowEndConfirm,
    showAddPlayers, setShowAddPlayers,
    checkedIn, setCheckedIn,
    // Handlinger
    loadAll,
    startSession, endSession,
    saveMatch, undoLast,
    addPlayerToOngoingSession,
    softDeleteSession, restoreSession,
    // Avledede verdier
    sessionStats, totalStats, sessionList,
  };
}
