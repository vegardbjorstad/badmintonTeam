// src/logic/matchGenerator.js

/**
 * Genererer neste kamp basert på:
 *  - hvilke spillere som er aktive
 *  - tidligere matcher
 *  - hvem som sitter over
 *  - hvilken side (team1/team2) spillerne har stått på
 *
 * Returnerer et objekt:
 * {
 *   team1: [id1, id2],
 *   team2: [id3, id4],
 *   sitting: [id5, id6, ...]
 * }
 *
 * Pauselogikk:
 *  - Ved 4 spillere: ingen pause, alle spiller alltid
 *  - Ved 5+ spillere: nøyaktig (antall - 4) spillere sitter over
 *  - Spillere i waitingQueue garanteres inn som de 4 første kandidatene
 *  - Resten fylles opp med de som har spilt færrest kamper
 *  - Spillere lagt til midt i økt får gamesPlayed = 0 og vil
 *    naturlig sitte over med en gang de andre har "tatt igjen"
 */

export default function generateNextMatch(activePlayers, matchHistory, waitingQueue) {
  if (activePlayers.length < 4) return null;

  const ids = activePlayers.map((p) => p.id);
  const n   = ids.length;

  // ── Bygg statistikk fra historikk ────────────────────────────────────────

  const gamesPlayed = Object.fromEntries(ids.map((id) => [id, 0]));

  const partnerCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );

  const oppCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );

  const sideBalance = Object.fromEntries(ids.map((id) => [id, 0]));
  const pairOnTeam1 = {};

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

    m.team1.forEach((id) => { if (id in sideBalance) sideBalance[id]++; });
    m.team2.forEach((id) => { if (id in sideBalance) sideBalance[id]--; });

    const pairKey = [...m.team1].sort().join("_");
    pairOnTeam1[pairKey] = (pairOnTeam1[pairKey] ?? 0) + 1;
  });

  // ── Velg de 4 spillerne som skal spille ──────────────────────────────────
  //
  // Logikk:
  //   1. Spillere i waitingQueue hentes ut først (i kø-rekkefølge)
  //   2. Resterende plasser fylles med de som har spilt færrest kamper
  //      — sortert på gamesPlayed, med litt tilfeldig tiebreak
  //   3. Alltid nøyaktig 4 kandidater, resten sitter over
  //
  // Dette sikrer at:
  //   - En ny spiller (gamesPlayed=0) ikke låser seg til å alltid spille
  //     fordi algoritmen nå separerer "hvem er i køen" fra "hvem har spilt minst"
  //   - Når 5+ spillere er aktive, MÅ noen sitte over (sitting er aldri tom)

  // Steg 1: garanterte spillere fra waitingQueue (filtrert til aktive)
  const fromQueue = waitingQueue.filter((id) => ids.includes(id));

  // Steg 2: resten sortert på gamesPlayed (færrest først)
  const notInQueue = ids
    .filter((id) => !fromQueue.includes(id))
    .sort((a, b) => gamesPlayed[a] - gamesPlayed[b]);

  // Steg 3: sett sammen og ta de 4 første
  const orderedPool = [...fromQueue, ...notInQueue];
  const cands       = orderedPool.slice(0, 4);
  const sitting     = orderedPool.slice(4); // alle som ikke fikk plass

  // ── Finn beste lagfordeling blant de 4 kandidatene ───────────────────────

  let best = null;

  for (let i = 0; i < cands.length - 1; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      const t1 = [cands[i], cands[j]];
      const t2 = cands.filter((x) => !t1.includes(x));

      const matchScore =
        (partnerCount[t1[0]][t1[1]] ?? 0) +
        (partnerCount[t2[0]][t2[1]] ?? 0) +
        t1
          .flatMap((a) => t2.map((b) => oppCount[a][b] ?? 0))
          .reduce((s, v) => s + v, 0);

      const t1SideScore = t1.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);

      const pairKey1   = [...t1].sort().join("_");
      const t1PairCount = pairOnTeam1[pairKey1] ?? 0;
      const pairKey2   = [...t2].sort().join("_");
      const t2PairCount = pairOnTeam1[pairKey2] ?? 0;
      const sidePenalty = t1SideScore * 0.5 + (t1PairCount - t2PairCount) * 0.5;

      const totalScore = matchScore + sidePenalty;

      if (!best || totalScore < best.score) {
        best = { t1, t2, score: totalScore };
      }
    }
  }

  // ── Vurder om team1 og team2 bør byttes ──────────────────────────────────

  const t1Balance = best.t1.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);
  const t2Balance = best.t2.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);

  const finalTeam1 = t1Balance <= t2Balance ? best.t1 : best.t2;
  const finalTeam2 = t1Balance <= t2Balance ? best.t2 : best.t1;

  return {
    team1:   finalTeam1,
    team2:   finalTeam2,
    sitting: ids.filter((id) => ![...finalTeam1, ...finalTeam2].includes(id)),
  };
}
