// supabase/functions/send-stats-summary/index.ts
//
// Kjøres kl. 09:00 hver dag av en Supabase Cron Job.
// Finner klubber som hadde trening i går og sender morsomme stats.

import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY     = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY    = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT        = Deno.env.get("VAPID_SUBJECT")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const headers = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
};

Deno.serve(async () => {
  // Finn gårsdagens dato
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  // Hent alle økter fra i går (ikke slettede)
  const sessRes = await fetch(
    `${SUPABASE_URL}/rest/v1/sessions?date=eq.${dateStr}&deleted_at=is.null&hidden=neq.true&select=id,club_id`,
    { headers }
  );
  const sessions = await sessRes.json();
  if (!sessions || sessions.length === 0) {
    return new Response("Ingen treninger i går", { status: 200 });
  }

  // Grupper per klubb
  const clubSessions: Record<string, string[]> = {};
  for (const s of sessions) {
    if (!clubSessions[s.club_id]) clubSessions[s.club_id] = [];
    clubSessions[s.club_id].push(s.id);
  }

  let sent = 0;

  for (const [clubId, sessionIds] of Object.entries(clubSessions)) {
    // Hent kamper fra disse øktene
    const matchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/matches?session_id=in.(${sessionIds.join(",")})&select=*`,
      { headers }
    );
    const matches = await matchRes.json();
    if (!matches || matches.length === 0) continue;

    // Hent spillernavn
    const playerIds = [...new Set(matches.flatMap((m: any) =>
      [m.team1_p1, m.team1_p2, m.team2_p1, m.team2_p2]
    ))];
    const playerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/players?id=in.(${playerIds.join(",")})&select=id,name`,
      { headers }
    );
    const players = await playerRes.json();
    const playerName = (id: string) => players.find((p: any) => p.id === id)?.name || "?";

    // Finn MVP — flest seire
    const wins: Record<string, number> = {};
    const games: Record<string, number> = {};
    for (const m of matches) {
      const t1 = [m.team1_p1, m.team1_p2];
      const t2 = [m.team2_p1, m.team2_p2];
      [...t1, ...t2].forEach((id: string) => { games[id] = (games[id] || 0) + 1; });
      const winners = m.winner === 1 ? t1 : t2;
      winners.forEach((id: string) => { wins[id] = (wins[id] || 0) + 1; });
    }

    const mvpId = Object.entries(wins).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mvpWins  = mvpId ? wins[mvpId] : 0;
    const mvpGames = mvpId ? games[mvpId] : 0;
    const mvpName  = mvpId ? playerName(mvpId) : "Ukjent";

    // Bygg varselstekst
    const body = `${mvpName} vant ${mvpWins} av ${mvpGames} kamper og var kveldets beste! 🏆 Totalt ${matches.length} kamper spilt.`;

    // Hent push-abonnementer
    const subsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?club_id=eq.${clubId}&select=endpoint,p256dh,auth`,
      { headers }
    );
    const subscriptions = await subsRes.json();

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "🏸 Treningsstatistikk fra i går",
            body,
            icon:  "/pwa-192.png",
            badge: "/pwa-192.png",
            url:   "/",
          })
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
            { method: "DELETE", headers }
          );
        }
      }
    }
  }

  return new Response(`Sendte ${sent} stats-varsler`, { status: 200 });
});
