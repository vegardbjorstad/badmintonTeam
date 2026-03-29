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
 */

export default function generateNextMatch(activePlayers, matchHistory, waitingQueue) {
  if (activePlayers.length < 4) return null;

  const ids = activePlayers.map((p) => p.id);

  // ── Bygg statistikk fra historikk ────────────────────────────────────────

  const gamesPlayed = Object.fromEntries(ids.map((id) => [id, 0]));

  // Antall ganger spilt sammen som par
  const partnerCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );

  // Antall ganger møtt som motstandere
  const oppCount = Object.fromEntries(
    ids.map((id) => [id, Object.fromEntries(ids.map((j) => [j, 0]))])
  );

  // Antall ganger stått på team1-siden (netto: team1-teller minus team2-teller)
  // Positiv verdi = har stått på team1 for ofte → bør over på team2
  const sideBalance = Object.fromEntries(ids.map((id) => [id, 0]));

  // Antall ganger dette paret har stått på team1 sammen
  const pairOnTeam1 = {};

  matchHistory.forEach((m) => {
    [m.team1[0], m.team1[1], m.team2[0], m.team2[1]].forEach((id) => {
      if (id in gamesPlayed) gamesPlayed[id]++;
    });

    // Partner-telling
    [[m.team1[0], m.team1[1]], [m.team2[0], m.team2[1]]].forEach(([a, b]) => {
      if (a in partnerCount && b in partnerCount[a]) {
        partnerCount[a][b]++;
        partnerCount[b][a]++;
      }
    });

    // Motstander-telling
    m.team1.forEach((a) =>
      m.team2.forEach((b) => {
        if (a in oppCount && b in oppCount[a]) {
          oppCount[a][b]++;
          oppCount[b][a]++;
        }
      })
    );

    // Side-balanse: team1 = +1, team2 = -1
    m.team1.forEach((id) => { if (id in sideBalance) sideBalance[id]++; });
    m.team2.forEach((id) => { if (id in sideBalance) sideBalance[id]--; });

    // Tell hvor mange ganger dette paret har vært på team1 sammen
    const pairKey = [...m.team1].sort().join("_");
    pairOnTeam1[pairKey] = (pairOnTeam1[pairKey] ?? 0) + 1;
  });

  // ── Velg de 4 spillerne som skal spille ──────────────────────────────────

  const pool = [...ids].sort((a, b) => {
    const aQ = waitingQueue.indexOf(a);
    const bQ = waitingQueue.indexOf(b);
    if (aQ !== -1 && bQ === -1) return -1;
    if (bQ !== -1 && aQ === -1) return 1;
    if (aQ !== -1 && bQ !== -1) return aQ - bQ;
    return gamesPlayed[a] - gamesPlayed[b];
  });

  const cands = pool.slice(0, 4);

  // ── Finn beste lagfordeling ───────────────────────────────────────────────

  let best = null;

  for (let i = 0; i < cands.length - 1; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      const t1 = [cands[i], cands[j]];
      const t2 = cands.filter((x) => !t1.includes(x));

      // Grunnpoeng: færre felles partnere og motstandere er bedre
      const matchScore =
        (partnerCount[t1[0]][t1[1]] ?? 0) +
        (partnerCount[t2[0]][t2[1]] ?? 0) +
        t1
          .flatMap((a) => t2.map((b) => oppCount[a][b] ?? 0))
          .reduce((s, v) => s + v, 0);

      // Side-penalty: summer sideBalance for spillerne på team1
      // Jo mer positiv summen er, jo oftere har de stått på team1 → straff
      const t1SideScore = t1.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);

      // Sjekk om dette paret bør bytte side:
      // Hvis de har vært på team1 oftere enn team2, gi straff
      const pairKey1 = [...t1].sort().join("_");
      const t1PairCount = pairOnTeam1[pairKey1] ?? 0;
      const pairKey2 = [...t2].sort().join("_");
      const t2PairCount = pairOnTeam1[pairKey2] ?? 0;
      const sidePenalty = t1SideScore * 0.5 + (t1PairCount - t2PairCount) * 0.5;

      const totalScore = matchScore + sidePenalty;

      if (!best || totalScore < best.score) {
        best = { t1, t2, score: totalScore };
      }
    }
  }

  // ── Vurder om team1 og team2 bør byttes ──────────────────────────────────
  // Hvis team1-spillerne har en positiv sideBalance (stått på team1 for ofte),
  // bytt dem over på team2 istedenfor

  const t1Balance = best.t1.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);
  const t2Balance = best.t2.reduce((s, id) => s + (sideBalance[id] ?? 0), 0);

  const finalTeam1 = t1Balance <= t2Balance ? best.t1 : best.t2;
  const finalTeam2 = t1Balance <= t2Balance ? best.t2 : best.t1;

  return {
    team1: finalTeam1,
    team2: finalTeam2,
    sitting: ids.filter((id) => ![...finalTeam1, ...finalTeam2].includes(id)),
  };
}
