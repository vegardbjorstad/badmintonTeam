// src/screens/ClubSelect.jsx

const getInitials = (name) =>
  name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

/**
 * ClubSelect
 * ----------
 * Landingsside. Viser søkefelt + liste over klubber.
 * Props: clubs, onSelect, onCreateNew, clubSearch, setClubSearch
 */
export default function ClubSelect({
  clubs,
  onSelect,
  onCreateNew,
  clubSearch,
  setClubSearch,
}) {
  const filtered = clubs.filter((c) =>
    c.name.toLowerCase().includes(clubSearch.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
          padding: "48px 24px 32px",
          textAlign: "center",
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 12 }}>🏸</div>
        <div
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: "#38bdf8",
            letterSpacing: "0.02em",
          }}
        >
          BADMINTON
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            fontWeight: 600,
            letterSpacing: "0.12em",
            marginTop: 4,
          }}
        >
          TRENINGSAPP
        </div>
      </div>

      <div style={{ padding: "24px 16px" }}>
        {/* Søk */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#475569",
            marginBottom: 8,
          }}
        >
          FINN DIN KLUBB
        </div>
        <input
          value={clubSearch}
          onChange={(e) => setClubSearch(e.target.value)}
          placeholder="Søk etter klubb..."
          style={{
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "2px solid #1e3a5f",
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: 16,
            padding: "0 16px",
            outline: "none",
            fontFamily: "'Barlow',sans-serif",
            boxSizing: "border-box",
            marginBottom: 12,
          }}
        />

        {/* Klubbliste */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px",
                borderRadius: 14,
                cursor: "pointer",
                background: "#0f172a",
                border: "2px solid #1e3a5f",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: c.color || "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: "'Barlow Condensed',sans-serif",
                  flexShrink: 0,
                }}
              >
                {getInitials(c.name)}
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, flex: 1, color: "#f8fafc" }}>
                {c.name}
              </span>
              <span style={{ color: "#334155", fontSize: 20 }}>›</span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#334155",
                padding: "20px 0",
                fontSize: 15,
              }}
            >
              Ingen klubber funnet
            </div>
          )}
        </div>

        {/* Skillelinje */}
        <div
          style={{
            height: 1,
            background: "#1e3a5f",
            marginBottom: 24,
          }}
        />

        {/* Opprett knapp */}
        <button
          onClick={onCreateNew}
          style={{
            width: "100%",
            height: 66,
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg,#38bdf8,#6366f1)",
            color: "#fff",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          + OPPRETT NY KLUBB
        </button>
      </div>
    </>
  );
}
