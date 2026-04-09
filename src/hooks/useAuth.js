// src/hooks/useAuth.js

import { useState, useEffect, useRef } from "react";
import supabase from "../logic/supabase";

const TOKEN_KEY  = "badminton_token";
const CLUB_KEY   = "badminton_club";
const TOKEN_DAYS = 30;

// SHA-256 hash via native browser crypto
async function sha256(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * useAuth
 * -------
 * Håndterer:
 *   - Sjekk av lagret token ved oppstart
 *   - Klubbliste fra Supabase
 *   - PIN-innlogging
 *   - Opprett ny klubb
 *   - Utlogging
 *
 * authState: "loading" | "clubs" | "pin" | "create" | "app"
 */
export function useAuth() {
  const [authState, setAuthState] = useState("loading");
  const [club, setClub]           = useState(null);
  const [clubs, setClubs]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [pinError, setPinError]   = useState(false);

  // Opprett-klubb skjema
  const [newClubName,  setNewClubName]  = useState("");
  const [newClubPin,   setNewClubPin]   = useState("");
  const [newClubPin2,  setNewClubPin2]  = useState("");
  const [newClubEmail, setNewClubEmail] = useState("");
  const [newClubColor, setNewClubColor] = useState("#38bdf8");

  const pinErrorTimer = useRef(null);

  // ── Oppstart: sjekk lagret token ──
  useEffect(() => {
    checkStoredAuth();
    loadClubs();
  }, []);

  async function loadClubs() {
    const { data } = await supabase.from("clubs").select("*").order("name");
    if (data) setClubs(data);
  }

  async function checkStoredAuth() {
    const token   = localStorage.getItem(TOKEN_KEY);
    const clubRaw = localStorage.getItem(CLUB_KEY);
    if (!token || !clubRaw) {
      setAuthState("clubs");
      return;
    }
    try {
      const savedClub = JSON.parse(clubRaw);
      const { data } = await supabase
        .from("auth_tokens")
        .select("*")
        .eq("token", token)
        .eq("club_id", savedClub.id)
        .single();
      if (data && new Date(data.expires_at) > new Date()) {
        setClub(savedClub);
        setAuthState("app");
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(CLUB_KEY);
        setAuthState("clubs");
      }
    } catch {
      setAuthState("clubs");
    }
  }

  // ── Velg klubb (går til PIN-skjerm) ──
  function selectClub(c) {
    setClub(c);
    setAuthState("pin");
  }

  // ── PIN-innlogging ──
  async function submitPin(pin) {
    if (pin.length < 4) return;
    setLoading(true);
    const hash = await sha256(pin);
    if (hash !== club.pin_hash) {
      setLoading(false);
      setPinError(true);
      clearTimeout(pinErrorTimer.current);
      pinErrorTimer.current = setTimeout(() => setPinError(false), 1200);
      return false; // feil PIN
    }
    const token   = randomToken();
    const expires = new Date();
    expires.setDate(expires.getDate() + TOKEN_DAYS);
    await supabase.from("auth_tokens").insert({
      club_id: club.id,
      token,
      expires_at: expires.toISOString(),
    });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CLUB_KEY, JSON.stringify(club));
    setLoading(false);
    setAuthState("app");
    return true;
  }

  // ── Opprett klubb ──
  async function createClub(showToast) {
    if (!newClubName.trim()) {
      showToast("Klubbnavn er påkrevd", "error");
      return;
    }
    if (newClubPin.length < 4) {
      showToast("PIN må være minst 4 siffer", "error");
      return;
    }
    if (newClubPin !== newClubPin2) {
      showToast("PIN-kodene stemmer ikke", "error");
      return;
    }
    setLoading(true);
    const pin_hash = await sha256(newClubPin);
    const { data, error } = await supabase
      .from("clubs")
      .insert({
        name:      newClubName.trim(),
        pin_hash,
        email:     newClubEmail.trim() || null,
        color:     newClubColor,
      })
      .select()
      .single();
    if (error || !data) {
      setLoading(false);
      showToast("Kunne ikke opprette klubb", "error");
      return;
    }
    // Logg inn automatisk
    const token   = randomToken();
    const expires = new Date();
    expires.setDate(expires.getDate() + TOKEN_DAYS);
    await supabase.from("auth_tokens").insert({
      club_id: data.id,
      token,
      expires_at: expires.toISOString(),
    });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CLUB_KEY, JSON.stringify(data));
    setLoading(false);
    setClub(data);
    setClubs((prev) => [...prev, data]);
    // Nullstill skjema
    setNewClubName(""); setNewClubPin(""); setNewClubPin2("");
    setNewClubEmail(""); setNewClubColor("#38bdf8");
    showToast(`${data.name} opprettet! 🎉`, "success");
    setAuthState("app");
  }

  // ── Logg ut ──
  async function logout() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) await supabase.from("auth_tokens").delete().eq("token", token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CLUB_KEY);
    setClub(null);
    setAuthState("clubs");
  }

  return {
    authState, setAuthState,
    club,
    clubs,
    loading,
    pinError,
    selectClub,
    submitPin,
    logout,
    // Opprett-klubb skjema
    newClubName,  setNewClubName,
    newClubPin,   setNewClubPin,
    newClubPin2,  setNewClubPin2,
    newClubEmail, setNewClubEmail,
    newClubColor, setNewClubColor,
    createClub,
  };
}
