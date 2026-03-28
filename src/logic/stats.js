// src/logic/stats.js

/**
 * computeStats
 * ------------
 * Tar inn:
 *   - matchSet  (liste av matcher)
 *   - pauseSet  (liste av pauser)
 *   - playerList (default: alle spillere fra DB)
 *
 * Returnerer en sortert liste med:
 * {
 *   id,
 *   name,
 *   wins,
 *   losses,
 *   pFor,
 *   pAgainst,
 *   pauses,
 *   games,
 *   pct,   // vinnprosent
 *   diff   // poengdiff
 * }
 */

export function computeStats(matchSet, pauseSet, playerList = []) {
  const stats = {};

  // Init stats for hver spiller
  playerList.forEach((p) => {
    stats[p.id] = {
      id: p.id,
      name: p.name,
      wins: 0,
      losses: 0,
      pFor: 0,
      pAgainst: 0,
      pauses: 0,
      games: 0,
    };
  });

  // Tell opp kamper
  matchSet.forEach((m) => {
    const entries = [
      [m.team1_p1, m.team1_p2, 1],
      [m.team2_p1, m.team2_p2, 2],
    ];

    entries.forEach(([p1, p2, side]) => {
      [p1, p2].forEach((id) => {
        if (!stats[id]) return;

        stats[id].games++;

        if (m.winner === side) stats[id].wins++;
        else stats[id].losses++;

        stats[id].pFor += side === 1 ? m.score_team1 : m.score_team2;
        stats[id].pAgainst += side === 1 ? m.score_team2 : m.score_team1;
      });
    });
  });

  // Pauser
  pauseSet.forEach((p) => {
    if (stats[p.player_id]) stats[p.player_id].pauses++;
  });

  // Transformér og sorter
  return Object.values(stats)
    .filter((s) => s.games > 0 || s.pauses > 0)
    .map((s) => ({
      ...s,
      pct: s.games > 0 ? Math.round((s.wins / s.games) * 100) : 0,
      diff: s.pFor - s.pAgainst,
    }))
    .sort((a, b) => b.pct - a.pct || b.diff - a.diff);
}