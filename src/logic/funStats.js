// src/logic/funStats.js

/**
 * Morsomme statistikk-beregninger for daglig popup.
 * Tar inn allMatches, allSessions og players fra App-state.
 */

// ── Hjelpere ─────────────────────────────────────────────────────────────────

function playerName(players, id) {
  return players.find((p) => p.id === id)?.name || "?";
}

function getActivePlayers(players, matches) {
  const ids = new Set(
    matches.flatMap((m) => [m.team1_p1, m.team1_p2, m.team2_p1, m.team2_p2])
  );
  return players.filter((p) => ids.has(p.id));
}

function matchesForPlayer(matches, id) {
  return matches.filter(
    (m) =>
      m.team1_p1 === id ||
      m.team1_p2 === id ||
      m.team2_p1 === id ||
      m.team2_p2 === id
  );
}

function didWin(match, playerId) {
  const onTeam1 = match.team1_p1 === playerId || match.team1_p2 === playerId;
  return onTeam1 ? match.winner === 1 : match.winner === 2;
}

// Sortert etter match_number innen session
function sortedMatches(matches) {
  return [...matches].sort((a, b) => {
    if (a.session_id !== b.session_id) return 0;
    return a.match_number - b.match_number;
  });
}

// ── Rekker ───────────────────────────────────────────────────────────────────

function longestStreak(matches, playerId, win) {
  const sorted = sortedMatches(matchesForPlayer(matches, playerId));
  let best = 0, current = 0;
  for (const m of sorted) {
    if (didWin(m, playerId) === win) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

// ── Partnere ─────────────────────────────────────────────────────────────────

function partnerStats(matches, playerId) {
  const stats = {};
  for (const m of matches) {
    let partnerId = null;
    if (m.team1_p1 === playerId) partnerId = m.team1_p2;
    else if (m.team1_p2 === playerId) partnerId = m.team1_p1;
    else if (m.team2_p1 === playerId) partnerId = m.team2_p2;
    else if (m.team2_p2 === playerId) partnerId = m.team2_p1;
    if (!partnerId) continue;
    if (!stats[partnerId]) stats[partnerId] = { wins: 0, games: 0 };
    stats[partnerId].games++;
    if (didWin(m, playerId)) stats[partnerId].wins++;
  }
  return stats;
}

// ── Uforutsigbarhet ──────────────────────────────────────────────────────────

// Standardavvik i vinnprosent per økt — høy verdi = uforutsigbar
function unpredictabilityScore(matches, allSessions, playerId) {
  const sessionIds = [...new Set(matches.map((m) => m.session_id))];
  const pcts = [];
  for (const sid of sessionIds) {
    const sm = matchesForPlayer(
      matches.filter((m) => m.session_id === sid),
      playerId
    );
    if (sm.length < 2) continue;
    const wins = sm.filter((m) => didWin(m, playerId)).length;
    pcts.push(wins / sm.length);
  }
  if (pcts.length < 2) return 0;
  const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  const variance = pcts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pcts.length;
  return Math.sqrt(variance);
}

// ── Deuce ────────────────────────────────────────────────────────────────────

function isDeuceMatch(m) {
  // Deuce: margin på 1-2 poeng og begge lag har scoret mye
  const diff = Math.abs(m.score_team1 - m.score_team2);
  const total = m.score_team1 + m.score_team2;
  return diff <= 2 && total >= 28;
}

function deuceWins(matches, playerId) {
  return matches.filter((m) => isDeuceMatch(m) && didWin(m, playerId)).length;
}

// ── Form siste 30 dager ───────────────────────────────────────────────────────

function recentForm(matches, allSessions, playerId) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const recentSessionIds = new Set(
    allSessions
      .filter((s) => new Date(s.date) >= cutoff)
      .map((s) => s.id)
  );

  const recent = matchesForPlayer(
    matches.filter((m) => recentSessionIds.has(m.session_id)),
    playerId
  );

  if (recent.length === 0) return null;
  const wins = recent.filter((m) => didWin(m, playerId)).length;
  return Math.round((wins / recent.length) * 100);
}

// ── Beste partnerkombo totalt ─────────────────────────────────────────────────

function bestPartnerCombo(matches, players) {
  const combos = {};
  for (const m of matches) {
    const pairs = [
      [m.team1_p1, m.team1_p2, m.winner === 1],
      [m.team2_p1, m.team2_p2, m.winner === 2],
    ];
    for (const [a, b, won] of pairs) {
      const key = [a, b].sort().join("_");
      if (!combos[key]) combos[key] = { wins: 0, games: 0, a, b };
      combos[key].games++;
      if (won) combos[key].wins++;
    }
  }
  const valid = Object.values(combos).filter((c) => c.games >= 3);
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.wins / b.games - a.wins / a.games);
  const best = valid[0];
  const worst = valid[valid.length - 1];
  return {
    best: {
      names: `${playerName(players, best.a)} & ${playerName(players, best.b)}`,
      pct: Math.round((best.wins / best.games) * 100),
      games: best.games,
    },
    worst: {
      names: `${playerName(players, worst.a)} & ${playerName(players, worst.b)}`,
      pct: Math.round((worst.wins / worst.games) * 100),
      games: worst.games,
    },
  };
}

// ── Favorittpartner per spiller ───────────────────────────────────────────────

function favoritePartner(matches, players, playerId) {
  const stats = partnerStats(matches, playerId);
  const valid = Object.entries(stats).filter(([, s]) => s.games >= 3);
  if (valid.length === 0) return null;
  valid.sort((a, b) => b[1].wins / b[1].games - a[1].wins / a[1].games);
  const [bestId, bestS] = valid[0];
  const [worstId, worstS] = valid[valid.length - 1];
  return {
    favorite: {
      name: playerName(players, bestId),
      pct: Math.round((bestS.wins / bestS.games) * 100),
    },
    hate: {
      name: playerName(players, worstId),
      pct: Math.round((worstS.wins / worstS.games) * 100),
    },
  };
}

// ── Hovedfunksjon ─────────────────────────────────────────────────────────────

export function computeFunStats(allMatches, allSessions, players) {
  // Bare aktive (ikke-slettede) sessions
  const activeSessions = allSessions.filter((s) => !s.deleted_at);
  const activeSessionIds = new Set(activeSessions.map((s) => s.id));
  const matches = allMatches.filter((m) => activeSessionIds.has(m.session_id));

  if (matches.length === 0 || players.length === 0) return null;

  const active = getActivePlayers(players, matches);
  if (active.length === 0) return null;

  // Per-spiller stats
  const perPlayer = active.map((p) => {
    const pm = matchesForPlayer(matches, p.id);
    const form = recentForm(matches, activeSessions, p.id);
    return {
      id: p.id,
      name: p.name,
      games: pm.length,
      wins: pm.filter((m) => didWin(m, p.id)).length,
      winStreak: longestStreak(matches, p.id, true),
      loseStreak: longestStreak(matches, p.id, false),
      unpredictability: unpredictabilityScore(matches, activeSessions, p.id),
      deuceWins: deuceWins(matches, p.id),
      recentForm: form,
      partner: favoritePartner(matches, players, p.id),
    };
  }).filter((p) => p.games > 0);

  if (perPlayer.length === 0) return null;

  // Sorteringer
  const byWinStreak   = [...perPlayer].sort((a, b) => b.winStreak - a.winStreak);
  const byLoseStreak  = [...perPlayer].sort((a, b) => b.loseStreak - a.loseStreak);
  const byGames       = [...perPlayer].sort((a, b) => b.games - a.games);
  const byRecentForm  = perPlayer.filter((p) => p.recentForm !== null)
                          .sort((a, b) => b.recentForm - a.recentForm);
  const byUnpred      = [...perPlayer].sort((a, b) => b.unpredictability - a.unpredictability);
  const byDeuce       = [...perPlayer].sort((a, b) => b.deuceWins - a.deuceWins);
  const combos        = bestPartnerCombo(matches, players);

  return {
    winStreak:      byWinStreak[0],
    loseStreak:     byLoseStreak[0],
    mostGames:      byGames[0],
    fewestGames:    byGames[byGames.length - 1],
    bestForm:       byRecentForm[0] ?? null,
    worstForm:      byRecentForm[byRecentForm.length - 1] ?? null,
    mostUnpred:     byUnpred[0],
    deuceKing:      byDeuce[0],
    bestCombo:      combos?.best ?? null,
    worstCombo:     combos?.worst ?? null,
    perPlayer,
  };
}
