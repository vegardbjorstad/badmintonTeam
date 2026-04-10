// src/components/PushSettings.jsx

/**
 * PushSettings
 * ------------
 * Vises i Home-skjermen.
 * Lar brukeren skru på/av push-varsler og sette neste treningsdato.
 *
 * Props:
 *   push     — objekt fra usePush()
 *   club     — gjeldende klubb
 *   onSaveTraining — fn(datetime) for å lagre neste treningsdato
 *   nextTraining   — ISO-streng for neste trening (fra clubs-tabellen)
 */
export default function PushSettings({ push, club, onSaveTraining, nextTraining }) {
  if (!push.supported) return null;

  const fmtTraining = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString("nb-NO", {
      weekday: "long", day: "numeric", month: "long",
    }) + " kl. " + d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      background: "#0f172a",
      border: "2px solid #1e3a5f",
      borderRadius: 16,
      padding: "16px 18px",
      marginBottom: 10,
    }}>
      <div style={{
        fontFamily: "'Barlow Condensed',sans-serif",
        fontSize: 13, fontWeight: 700,
        letterSpacing: "0.08em", color: "#475569",
        marginBottom: 12,
      }}>
        🔔 PUSH-VARSLER
      </div>

      {/* Abonnement-status */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>
            {push.subscribed ? "Varsler er på" : "Varsler er av"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            {push.subscribed
              ? "Du får påminnelse før trening og stats etterpå"
              : push.permission === "denied"
              ? "Blokkert i nettleserinnstillinger"
              : "Skru på for å få treningsvarsler"}
          </div>
        </div>
        <button
          onClick={push.subscribed ? push.unsubscribe : push.subscribe}
          disabled={push.loading || push.permission === "denied"}
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 10,
            border: "none",
            background: push.subscribed
              ? "#1e293b"
              : "linear-gradient(135deg,#38bdf8,#6366f1)",
            color: push.subscribed ? "#64748b" : "#fff",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700, fontSize: 14,
            cursor: push.loading || push.permission === "denied" ? "default" : "pointer",
            opacity: push.loading ? 0.6 : 1,
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {push.loading ? "..." : push.subscribed ? "Skru av" : "Skru på"}
        </button>
      </div>

      {/* Neste trening */}
      {push.subscribed && (
        <div>
          <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>
            NESTE TRENING
          </div>
          {nextTraining ? (
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>
              📅 {fmtTraining(nextTraining)}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
              Ingen trening satt ennå
            </div>
          )}
          <input
            type="datetime-local"
            onChange={(e) => e.target.value && onSaveTraining(e.target.value)}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 10,
              border: "2px solid #1e3a5f",
              background: "#020617",
              color: "#f8fafc",
              fontSize: 14,
              padding: "0 12px",
              outline: "none",
              fontFamily: "'Barlow',sans-serif",
              boxSizing: "border-box",
              colorScheme: "dark",
            }}
          />
          <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
            Alle i klubben får påminnelse 2 timer før
          </div>
        </div>
      )}
    </div>
  );
}
