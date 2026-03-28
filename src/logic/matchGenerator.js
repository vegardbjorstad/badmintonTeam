// src/logic/matchGenerator.js

/**
 * Genererer neste kamp basert på:
 *  - hvilke spillere som er aktive
 *  - tidligere matcher
 *  - hvem som sitter over
 * 
 * Returnerer et objekt:
 * {
 *   team1: [id1, id2],
 *   team2: [id3, id4],
 *   sitting: [id5, id6, ...]
 * }
 */

export default function generateNextMatch(activePlayers, matchHistory, waitingQueue) {
  if (activePlayers.length < 4) return null;

  const ids = activePlayers.map((p) => p.id);

  // Track
  const gamesPlayed = Object.fromEntries(ids.map((id) => [id, 0]));
  const partnerCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );
  const oppCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );

  // Build stats from match history
  matchHistory.forEach((m) => {
    [m.team1[0], m.team1[1], m.team2[0], m.team2[1]].forEach((id) => {
      if (id in gamesPlayed) gamesPlayed[id]++;
    });

    [[m.team1[0], m.team1[1]], [m.team2[0], m.team2[1]]].forEach(([a, b]) => {
      if (a in partnerCount && b in partnerCount[a]) {
        partnerCount[a][b]++;
        partnerCount[b][a]++;
      }
    });

    m.team1.forEach((a) =>
      m.team2.forEach((b) => {
        if (a in oppCount && b in oppCount[a]) {
          oppCount[a][b]++;
          oppCount[b][a]++;
        }
      })
    );
  });

  // Sort possible players — waitingQueue first, then fewest matches
  const pool = [...ids].sort((a, b) => {
    const aQ = waitingQueue.indexOf(a);
    const bQ = waitingQueue.indexOf(b);

    if (aQ !== -1 && bQ === -1) return -1;
    if (bQ !== -1 && aQ === -1) return 1;
    if (aQ !== -1 && bQ !== -1) return aQ - bQ;

    return gamesPlayed[a] - gamesPlayed[b];
  });

  const cands = pool.slice(0, 4);
  let best = null;

  // Evaluate all 2v2 combinations
  for (let i = 0; i < cands.length - 1; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      const t1 = [cands[i], cands[j]];
      const t2 = cands.filter((x) => !t1.includes(x));

      const score =
        (partnerCount[t1[0]][t1[1]] ?? 0) +
        (partnerCount[t2[0]][t2[1]] ?? 0) +
        t1
          .flatMap((a) => t2.map((b) => oppCount[a][b] ?? 0))
          .reduce((s, v) => s + v, 0);

      if (!best || score < best.score) best = { t1, t2, score };
    }
  }

  return {
    team1: best.t1,
    team2: best.t2,
    sitting: ids.filter((id) => ![...best.t1, ...best.t2].includes(id)),
  };
}
``
