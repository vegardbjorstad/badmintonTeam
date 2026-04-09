// src/screens/PinScreen.jsx

import { useState } from "react";

const getInitials = (name) =>
  name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

/**
 * PinScreen
 * ---------
 * Viser stor numpad for PIN-innlogging.
 * Props:
 *   club         — valgt klubbobjekt
 *   onSubmit     — async fn(pin) → true/false
 *   onBack       — gå tilbake til klubbliste
 *   pinError     — boolean, rister ved feil
 *   loading      — boolean
 */
export default function PinScreen({ club, onSubmit, onBack, pinError, loading }) {
  const [pin, setPin] = useState("");

  const handleKey = async (k) => {
    if (loading) return;
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      const ok = await onSubmit(next);
      if (!ok) setPin(""); // nullstill ved feil PIN
    }
  };

  const clubColor = club?.color || "#38bdf8";

  return (
    <>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
          padding: "36px 24px 24px",
          textAlign: "center",
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        {/* Klubb-avatar */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: clubColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'Barlow Condensed',sans-serif",
            margin: "0 auto 12px",
          }}
        >
          {getInitials(club.name)}
        </div>
        <div
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#f8fafc",
          }}
        >
          {club.name}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          Skriv inn PIN-kode
        </div>
      </div>

      <div style={{ padding: "36px 32px 24px" }}>
        {/* PIN-prikker */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const filled = pin.length > i;
            return (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  border: `3px solid ${
                    pinError
                      ? "#ef4444"
                      : filled
                      ? clubColor
                      : "#1e3a5f"
                  }`,
                  background: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  color: filled ? "#f8fafc" : "transparent",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                ●
              </div>
            );
          })}
        </div>

        {/* Numpad */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            maxWidth: 280,
            margin: "0 auto",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
            <button
              key={i}
              onClick={() => k !== "" && handleKey(String(k))}
              disabled={loading || k === ""}
              style={{
                height: 68,
                borderRadius: 16,
                background: k === "" ? "transparent" : "#0f172a",
                border: k === "" ? "none" : "2px solid #1e3a5f",
                color: "#f8fafc",
                fontSize: k === "⌫" ? 22 : 26,
                fontWeight: 700,
                cursor: k === "" || loading ? "default" : "pointer",
                fontFamily: "'Barlow Condensed',sans-serif",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Feilmelding */}
        {pinError && (
          <div
            style={{
              textAlign: "center",
              color: "#ef4444",
              marginTop: 20,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Feil PIN-kode, prøv igjen
          </div>
        )}

        {/* Tilbake */}
        <div style={{ marginTop: 32 }}>
          <button
            onClick={onBack}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 14,
              background: "none",
              border: "2px solid #1e3a5f",
              color: "#94a3b8",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            ← Velg annen klubb
          </button>
        </div>
      </div>
    </>
  );
}
