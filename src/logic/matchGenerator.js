// src/logic/matchGenerator.js

/**
 * Genererer neste kamp basert på:
 *  - hvilke spillere som er aktive
 *  - tidligere matcher
 *  - hvem som sitter over
 *  - hvilken side (team1/team2) spillerne har stått på
 *
 * Støtter matchType: "doubles" (default) og "singles"
 *
 * Pauselogikk (doubles):
 *  - 4 spillere: ingen pause, alle spiller alltid
 *  - 5 spillere: 1 sitter over, maks 4 kamper på rad
 *  - 6 spillere: 2 sitter over — valgt slik at ingen sitter med
 *    samme person for ofte (satTogetherCount), og de med flest
 *    kamper prioriteres til pause
 *  - 7+ spillere: samme prinsipp, skalerer automatisk
 *
 * Returnerer: { team1, team2, sitting, match_type }
 */

const MAX_CONSECUTIVE = 4;

// ── Singel-generator ──────────────────────────────────────────────────────────

function generateSinglesMatch(activePlayers, matchHistory) {
  if (activePlayers.length < 2) return null;

  const ids = activePlayers.map(p => p.id);

  // Tell kamper mot hverandre
  const h2h = Object.fromEntries(ids.map(id => [id, Object.fromEntries(ids.map(j => [j, 0]))]));
  const gamesPlayed = Object.fromEntries(ids.map(id => [id, 0]));

  matchHistory.forEach(m => {
    const p1 = m.team1[0];
    const p2 = m.team2[0];
    if (!p1 || !p2) return;
    if (p1 in h2h && p2 in h2h[p1]) { h2h[p1][p2]++; h2h[p2][p1]++; }
    if (p1 in gamesPlayed) gamesPlayed[p1]++;
    if (p2 in gamesPlayed) gamesPlayed[p2]++;
  });

  // Hvem sitter over? (antall spillere minus 2)
  const numSitting = ids.length - 2;
  let sittingIds = [];

  if (numSitting > 0) {
    // Sorter etter flest spilte kamper — de med mest spiller færrest sitter over
    sittingIds = [...ids]
      .sort((a, b) => gamesPlayed[b] - gamesPlayed[a])
      .slice(0, numSitting);
  }

  const playing = ids.filter(id => !sittingIds.includes(id));

  // Finn paret med færrest møter
  let bestPair = null, bestCount = Infinity;
  for (let i = 0; i < playing.length - 1; i++) {
    for (let j = i + 1; j < playing.length; j++) {
      const count = h2h[playing[i]][playing[j]] ?? 0;
      if (count < bestCount) {
        bestCount = count;
        bestPair = [playing[i], playing[j]];
      }
    }
  }

  if (!bestPair) bestPair = [playing[0], playing[1]];

  return {
    team1: [bestPair[0]],
    team2: [bestPair[1]],
    sitting: sittingIds,
    match_type: "singles",
  };
}

// ── Dobbel-generator ──────────────────────────────────────────────────────────

export default function generateNextMatch(activePlayers, matchHistory, waitingQueue, matchType = "doubles") {
  if (matchType === "singles") {
    return generateSinglesMatch(activePlayers, matchHistory);
  }

  if (activePlayers.length < 4) return null;

  const ids        = activePlayers.map((p) => p.id);
  const numSitting = ids.length - 4;

  // ── Bygg statistikk fra historikk ────────────────────────────────────────

  const gamesPlayed       = Object.fromEntries(ids.map((id) => [id, 0]));
  const consecutivePlayed = Object.fromEntries(ids.map((id) => [id, 0]));
  const consecutiveSat    = Object.fromEntries(ids.map((id) => [id, 0]));

  const satTogetherCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );

  const partnerCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );
  const oppCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );
  const sideBalance = Object.fromEntries(ids.map((id) => [id, 0]));
  const pairOnTeam1 = {};

  matchHistory.forEach((m) => {
    const players = [m.team1[0], m.team1[1], m.team2[0], m.team2[1]].filter(Boolean);
    const sitting = ids.filter((id) => !players.includes(id));

    players.forEach((id) => {
      if (!(id in gamesPlayed)) return;
      gamesPlayed[id]++;
      consecutivePlayed[id]++;
      consecutiveSat[id] = 0;
    });
    sitting.forEach((id) => {
      consecutivePlayed[id] = 0;
      consecutiveSat[id]++;
    });

    for (let i = 0; i < sitting.length; i++)
      for (let j = i + 1; j < sitting.length; j++) {
        satTogetherCount[sitting[i]][sitting[j]]++;
        satTogetherCount[sitting[j]][sitting[i]]++;
      }

    [[m.team1[0], m.team1[1]], [m.team2[0], m.team2[1]]].forEach(([a, b]) => {
      if (!a || !b) return;
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
    m.team1.forEach((id) => { if (id in sideBalance) sideBalance[id]++; });
    m.team2.forEach((id) => { if (id in sideBalance) sideBalance[id]--; });

    const pairKey = [...m.team1].sort().join("_");
    pairOnTeam1[pairKey] = (pairOnTeam1[pairKey] ?? 0) + 1;
  });

  // ── Velg hvem som sitter over ─────────────────────────────────────────────

  let sittingIds = [];

  if (numSitting > 0) {
    const mustSit = ids.filter((id) => consecutivePlayed[id] >= MAX_CONSECUTIVE);
    const canSit  = ids.filter((id) => consecutivePlayed[id] < MAX_CONSECUTIVE);

    const forcedSitting = [...mustSit]
      .sort((a, b) => gamesPlayed[b] - gamesPlayed[a])
      .slice(0, numSitting);

    const remainingSlots = numSitting - forcedSitting.length;

    if (remainingSlots <= 0) {
      sittingIds = forcedSitting;
    } else {
      const candidates = canSit.filter((id) => !forcedSitting.includes(id));

      function combinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length < k) return [];
        const [first, ...rest] = arr;
        return [
          ...combinations(rest, k - 1).map((c) => [first, ...c]),
          ...combinations(rest, k),
        ];
      }

      const combos = combinations(candidates, remainingSlots);
      let bestSitting = null, bestScore = Infinity;

      combos.forEach((combo) => {
        const fullSitting = [...forcedSitting, ...combo];

        let satScore = 0;
        for (let i = 0; i < fullSitting.length; i++)
          for (let j = i + 1; j < fullSitting.length; j++)
            satScore += satTogetherCount[fullSitting[i]][fullSitting[j]] * 10;

        const playedScore = -combo.reduce((s, id) => s + gamesPlayed[id], 0);
        const satStreakScore = combo.reduce((s, id) => s + consecutiveSat[id], 0) * 2;

        const total = satScore + playedScore + satStreakScore;
        if (total < bestScore) { bestScore = total; bestSitting = combo; }
      });

      sittingIds = [...forcedSitting, ...bestSitting];
    }
  }

  // ── Finn beste lagfordeling blant de 4 som spiller ───────────────────────

  const playingIds = ids.filter((id) => !sittingIds.includes(id));
  let best = null;

  for (let i = 0; i < playingIds.length - 1; i++) {
    for (let j = i + 1; j < playingIds.length; j++) {
      const t1 = [playingIds[i], playingIds[j]];
      const t2 = playingIds.filter((x) => !t1.includes(x));

      const matchScore =
        (partnerCount[t1[0]][t1[1]] ?? 0) +
        (partnerCount[t2[0]][t2[1]] ?? 0) +
        t1.flatMap((a) => t2.map((b) => oppCount[a][b] ?? 0))
          .reduce((s, v) => s + v, 0);

      const t1SideScore = t1.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);
      const pk1 = [...t1].sort().join("_");
      const pk2 = [...t2].sort().join("_");
      const sidePenalty =
        t1SideScore * 0.5 + ((pairOnTeam1[pk1] ?? 0) - (pairOnTeam1[pk2] ?? 0)) * 0.5;

      const total = matchScore + sidePenalty;
      if (!best || total < best.score) best = { t1, t2, score: total };
    }
  }

  const t1Bal = best.t1.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);
  const t2Bal = best.t2.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);
  const finalTeam1 = t1Bal <= t2Bal ? best.t1 : best.t2;
  const finalTeam2 = t1Bal <= t2Bal ? best.t2 : best.t1;

  return {
    team1:      finalTeam1,
    team2:      finalTeam2,
    sitting:    sittingIds,
    match_type: "doubles",
  };
}
