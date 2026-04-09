// src/screens/CreateClub.jsx

const CLUB_COLORS = [
  "#38bdf8", "#6366f1", "#10b981", "#f97316",
  "#f43f5e", "#a855f7", "#eab308", "#14b8a6",
];

/**
 * CreateClub
 * ----------
 * Skjema for å opprette en ny klubb.
 * Props fra useAuth:
 *   newClubName, setNewClubName
 *   newClubPin,  setNewClubPin
 *   newClubPin2, setNewClubPin2
 *   newClubEmail, setNewClubEmail
 *   newClubColor, setNewClubColor
 *   createClub   — async fn(showToast)
 *   loading
 *   onBack       — gå tilbake til klubbliste
 *   showToast    — fra useSession / App
 */
export default function CreateClub({
  newClubName,  setNewClubName,
  newClubPin,   setNewClubPin,
  newClubPin2,  setNewClubPin2,
  newClubEmail, setNewClubEmail,
  newClubColor, setNewClubColor,
  createClub,
  loading,
  onBack,
  showToast,
}) {
  const pinMismatch = newClubPin2.length > 0 && newClubPin !== newClubPin2;
  const canSubmit   = newClubName.trim() && newClubPin.length >= 4 && newClubPin === newClubPin2;

  const inputStyle = (extraBorder) => ({
    width: "100%",
    height: 54,
    borderRadius: 12,
    border: `2px solid ${extraBorder || "#1e3a5f"}`,
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: 16,
    padding: "0 16px",
    outline: "none",
    fontFamily: "'Barlow',sans-serif",
    boxSizing: "border-box",
    marginBottom: 16,
  });

  return (
    <>
      {/* Topbar */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
          padding: "18px 16px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: 22,
            cursor: "pointer",
            padding: 4,
          }}
        >
          ←
        </button>
        <div
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#38bdf8",
            letterSpacing: "0.04em",
          }}
        >
          OPPRETT KLUBB
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Klubbnavn */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>
          KLUBBNAVN *
        </div>
        <input
          value={newClubName}
          onChange={(e) => setNewClubName(e.target.value)}
          placeholder="F.eks. Tromsø Badmintonklubb"
          style={inputStyle()}
        />

        {/* PIN */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>
          PIN-KODE (4 siffer) *
        </div>
        <input
          value={newClubPin}
          onChange={(e) => setNewClubPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="F.eks. 2847"
          type="password"
          inputMode="numeric"
          style={inputStyle()}
        />

        {/* Bekreft PIN */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>
          BEKREFT PIN *
        </div>
        <input
          value={newClubPin2}
          onChange={(e) => setNewClubPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Gjenta PIN"
          type="password"
          inputMode="numeric"
          style={inputStyle(pinMismatch ? "#ef4444" : undefined)}
        />
        {pinMismatch && (
          <div style={{ color: "#ef4444", fontSize: 12, marginTop: -12, marginBottom: 16 }}>
            PIN-kodene stemmer ikke
          </div>
        )}

        {/* E-post */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>
          E-POST FOR PIN-GJENOPPRETTING (valgfri)
        </div>
        <input
          value={newClubEmail}
          onChange={(e) => setNewClubEmail(e.target.value)}
          placeholder="klubb@epost.no"
          type="email"
          style={inputStyle()}
        />

        {/* Farge */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#475569", marginBottom: 8 }}>
          KLUBBFARGE (valgfri)
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          {CLUB_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => setNewClubColor(c)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border: `3px solid ${newClubColor === c ? "#fff" : "transparent"}`,
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={() => createClub(showToast)}
          disabled={loading || !canSubmit}
          style={{
            width: "100%",
            height: 66,
            borderRadius: 14,
            border: "none",
            background:
              !canSubmit || loading
                ? "#1e293b"
                : "linear-gradient(135deg,#38bdf8,#6366f1)",
            color: !canSubmit || loading ? "#475569" : "#fff",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "0.06em",
            cursor: !canSubmit || loading ? "default" : "pointer",
          }}
        >
          {loading ? "OPPRETTER..." : "OPPRETT KLUBB →"}
        </button>
      </div>
    </>
  );
}
