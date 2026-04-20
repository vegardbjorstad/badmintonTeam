// src/components/DailyStatsPopup.jsx

/**
 * DailyStatsPopup
 * ---------------
 * Vises automatisk én gang daglig når appen åpnes.
 * Lagrer dato i localStorage så den ikke dukker opp igjen samme dag.
 *
 * Props:
 *   stats   — objekt fra computeFunStats()
 *   onClose — funksjon for å lukke popup
 */

// Mapping fra stat-nøkkel → visningsinfo
const STAT_CONFIG = {
  winStreak: (d) => ({
    icon: "🔥",
    label: "Lengste seiersrekke",
    value: d.name,
    sub: `${d.winStreak} kamper på rad`,
  }),
  winStreakLast: (d) => ({
    icon: "⚡",
    label: "Best siste økt",
    value: d.name,
    sub: `${d.winStreakLast} seire på rad forrige trening`,
  }),
  mostGames: (d) => ({
    icon: "👑",
    label: "Flest kamper totalt",
    value: d.name,
    sub: `${d.games} kamper spilt`,
  }),
  bestForm: (d) => ({
    icon: "📈",
    label: "Best form siste 14 dager",
    value: d.name,
    sub: `${d.recentForm}% vinnprosent`,
  }),
  bestCombo: (d) => ({
    icon: "🤝",
    label: "Beste partnerkombo",
    value: d.names,
    sub: `${d.pct}% vinnprosent over ${d.games} kamper`,
  }),
  worstCombo: (d) => ({
    icon: "💔",
    label: "Verste partnerkombo",
    value: d.names,
    sub: `${d.pct}% vinnprosent over ${d.games} kamper`,
  }),
  mostUnpred: (d) => ({
    icon: "🎲",
    label: "Mest uforutsigbar spiller",
    value: d.name,
    sub: "Ingen vet hva som skjer neste kamp",
  }),
  deuceKing: (d) => ({
    icon: "⚡",
    label: "Deuce-kongen",
    value: d.name,
    sub: `Vinner ${d.deuceWins} tette kamper`,
  }),
  revengeKing: (d) => ({
    icon: "😤",
    label: "Revansjekongen",
    value: d.name,
    sub: `Hevner seg ${d.revenge.pct}% av gangene etter et tap (${d.revenge.successes}/${d.revenge.attempts})`,
  }),
  bestAttendance: (d) => ({
    icon: "📅",
    label: "Best oppmøte",
    value: d.name,
    sub: `${d.attendance.attended} av ${d.attendance.total} treninger (${d.attendance.pct}%)`,
  }),
  bestDefense: (d) => ({
    icon: "🛡️",
    label: "Beste forsvar",
    value: d.name,
    sub: `Slipper inn ${d.defense} poeng for hvert poeng scoret`,
  }),
  biggestProgress: (d) => ({
    icon: "🚀",
    label: "Størst fremgang",
    value: d.name,
    sub: `Gikk fra ${d.progress.prev}% til ${d.progress.last}% vinnprosent siste trening (+${d.progress.diff}%)`,
  }),
  biggestUpset: (d) => ({
    icon: "😱",
    label: "Overraskelsen",
    value: d.names,
    sub: `Slo et lag med ${d.loserPct}% vinnprosent til tross for bare ${d.winnerPct}% selv!`,
  }),
  drJekyll: (d) => ({
    icon: "🎭",
    label: "Dr. Jekyll",
    value: d.name,
    sub: `Beste økt: ${d.drJekyll.best}% — verste økt: ${d.drJekyll.worst}%. Hvem er du egentlig?`,
  }),
};

export default function DailyStatsPopup({ stats, onClose }) {
  if (!stats) return null;

  const rows = Object.entries(stats.stats ?? {})
    .map(([key, data]) => {
      const builder = STAT_CONFIG[key];
      return builder ? builder(data) : null;
    })
    .filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 2000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 0 0 0",
      }}
    >
      <div
        style={{
          background: "#0a1628",
          border: "2px solid #1e3a5f",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "88dvh",
          overflowY: "auto",
          paddingBottom: 32,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)",
            padding: "20px 20px 16px",
            borderBottom: "2px solid #1e3a5f",
            position: "sticky",
            top: 0,
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 24,
              fontWeight: 800,
              color: "#38bdf8",
              letterSpacing: "0.04em",
              marginBottom: 2,
            }}
          >
            🏸 DAGENS HØYDEPUNKTER
          </div>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Oppdatert statistikk for alle spillere
          </div>
        </div>

        {/* Rader */}
        <div style={{ padding: "12px 16px" }}>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                marginBottom: 8,
                background: "#0f172a",
                border: "2px solid #1e293b",
                borderRadius: 16,
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{row.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#475569",
                    marginBottom: 2,
                  }}
                >
                  {row.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#f8fafc",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.value}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {row.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lukk-knapp */}
        <div style={{ padding: "0 16px" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              height: 58,
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg,#38bdf8,#6366f1)",
              color: "#fff",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            LA OSS SPILLE! 🏸
          </button>
        </div>
      </div>
    </div>
  );
}
