// supabase/functions/send-test-push/index.ts
//
// Kun for testing — sender push til alle i klubben uansett tidspunkt

import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY     = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY    = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT        = Deno.env.get("VAPID_SUBJECT")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  };

  // Hent alle push-abonnementer
  const subsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth`,
    { headers }
  );
  const subscriptions = await subsRes.json();

  if (!subscriptions || subscriptions.length === 0) {
    return new Response("Ingen abonnenter funnet", { status: 200 });
  }

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: "🏸 Test-varsel fra Badmintonappen!",
          body:  "Push-varsler fungerer som de skal 🎉",
          icon:  "/pwa-192.png",
          badge: "/pwa-192.png",
          url:   "/",
        })
      );
      sent++;
    } catch (err: any) {
      console.error("Push error:", err);
      // Slett utdaterte subscriptions
      if (err.statusCode === 410) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
          { method: "DELETE", headers }
        );
      }
    }
  }

  return new Response(`Sendte ${sent} testvarsler`, { status: 200 });
});
