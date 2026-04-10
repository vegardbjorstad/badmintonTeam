// src/hooks/usePush.js

import { useState, useEffect } from "react";
import supabase from "../logic/supabase";

const VAPID_PUBLIC_KEY = "BA0NBJtNbc_rHJJWsFfGEon9atocFRfeE_3l_l3p3eFENp0aabR77VKZr1G-ewccPRxGOAfXetb8hJ-NRPjq8LY";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * usePush
 * -------
 * Håndterer push-varsler:
 *  - Sjekker om nettleseren støtter push
 *  - Ber om tillatelse
 *  - Lagrer subscription i Supabase
 *  - Returnerer status og subscribe-funksjon
 */
export function usePush(club) {
  const [supported, setSupported]   = useState(false);
  const [permission, setPermission] = useState("default"); // default | granted | denied
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    // Sjekk støtte — kun vis i PWA-modus (installert på hjemskjerm)
    const isPWA = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
    const ok = isPWA && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;

    setPermission(Notification.permission);

    // Sjekk om allerede subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  async function subscribe() {
    if (!supported || !club) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      // Be om tillatelse
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      // Lag subscription
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();

      // Lagre i Supabase
      const { error } = await supabase.from("push_subscriptions").upsert({
        club_id: club.id,
        endpoint: subJson.endpoint,
        p256dh:   subJson.keys.p256dh,
        auth:     subJson.keys.auth,
      }, { onConflict: "endpoint" });

      if (error) {
        console.error("Push subscription error:", error);
      } else {
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Subscribe error:", err);
    }
    setLoading(false);
  }

  async function unsubscribe() {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
        setSubscribed(false);
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
    setLoading(false);
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
