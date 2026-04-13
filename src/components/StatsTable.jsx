// src/components/StatsTable.jsx

/**
 * StatsTable
 * ----------
 * Viser en tabell med spillerstatistikk.
 * Brukes i Stats.jsx og SessionDetail.jsx.
 *
 * Props:
 *   rows  — array fra computeStats(), sortert etter vinnprosent
 */
export default function StatsTable({ rows }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "#334155",
          padding: "48px 0",
          fontSize: 15,
        }}
      >
        Ingen data ennå
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      style={{
        background: "#0f172a",
        border: "2px solid #1e3a5f",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header-rad */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 34px 34px 34px 46px 42px",
          padding: "10px 14px",
          borderBottom: "2px solid #1e3a5f",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#475569",
        }}
      >
        <div>SPILLER</div>
        {["K", "V", "T", "P±", "%"].map((h) => (
          <div key={h} style={{ textAlign: "center" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Data-rader */}
      {rows.map((s, i) => (
        <div
          key={s.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 34px 34px 34px 46px 42px",
            padding: "12px 14px",
            alignItems: "center",
            borderBottom:
              i < rows.length - 1 ? "1px solid #1e293b" : "none",
            background:
              i === 0 ? "rgba(56,189,248,0.05)" : "transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, minWidth: 20 }}>
              {medals[i] || i + 1}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
          </div>
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            {s.games}
          </div>
          <div
            style={{
              textAlign: "center",
              color: "#16a34a",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {s.wins}
          </div>
          <div
            style={{
              textAlign: "center",
              color: "#ef4444",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {s.losses}
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              fontWeight: 700,
              color: s.diff >= 0 ? "#16a34a" : "#ef4444",
            }}
          >
            {s.diff > 0 ? "+" : ""}
            {s.diff}
          </div>
          <div
            style={{
              textAlign: "right",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: s.pct >= 50 ? "#38bdf8" : "#64748b",
            }}
          >
            {s.pct}%
          </div>
        </div>
      ))}

      {/* Forklaring */}
      <div
        style={{
          padding: "8px 14px",
          borderTop: "1px solid #1e293b",
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {[
          ["K", "Kamper"],
          ["V", "Vunnet"],
          ["T", "Tapt"],
          ["P±", "Poengdiff"],
          ["%", "Vinnprosent"],
        ].map(([k, v]) => (
          <div key={k} style={{ fontSize: 11, color: "#334155" }}>
            <span style={{ color: "#475569", fontWeight: 700 }}>{k}</span> ={" "}
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}
