// supabase/functions/send-training-reminder/index.ts
//
// Kjøres av en Supabase Cron Job hvert 15. minutt.
// Finner klubber der neste_trening er om ca. 2 timer og sender push.

import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT     = Deno.env.get("VAPID_SUBJECT")!;
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async () => {
  const now = new Date();
  // Finn treninger som starter om reminder_hours timer (±15 min)
  const windowStart = new Date(now.getTime() + 1.75 * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + 2.25 * 60 * 60 * 1000);

  // Hent klubber med kommende trening
  const clubsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clubs?next_training=gte.${windowStart.toISOString()}&next_training=lte.${windowEnd.toISOString()}&select=id,name,next_training`,
    { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  const clubs = await clubsRes.json();

  if (!clubs || clubs.length === 0) {
    return new Response("Ingen treninger å varsle om", { status: 200 });
  }

  let sent = 0;
  for (const club of clubs) {
    const trainingTime = new Date(club.next_training);
    const timeStr = trainingTime.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

    // Hent alle push-abonnementer for denne klubben
    const subsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?club_id=eq.${club.id}&select=endpoint,p256dh,auth`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const subscriptions = await subsRes.json();

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: `🏸 Trening om 2 timer!`,
            body:  `${club.name} spiller kl. ${timeStr}. Gjør deg klar!`,
            icon:  "/pwa-192.png",
            badge: "/pwa-192.png",
            url:   "/",
          })
        );
        sent++;
      } catch (err) {
        // Subscription er utgått — slett den
        if (err.statusCode === 410) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
            { method: "DELETE", headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
          );
        }
      }
    }
  }

  return new Response(`Sendte ${sent} varsler`, { status: 200 });
});
