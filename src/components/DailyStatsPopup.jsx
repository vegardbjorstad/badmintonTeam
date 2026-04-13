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
export default function DailyStatsPopup({ stats, onClose }) {
  if (!stats) return null;

  const rows = [
    stats.winStreak && {
      icon: "🔥",
      label: "Lengste seiersrekke",
      value: `${stats.winStreak.name}`,
      sub: `${stats.winStreak.winStreak} kamper på rad`,
    },
   /* stats.loseStreak && stats.loseStreak.loseStreakLast > 0 && {
      icon: "💀",
      label: "Dårlig avslutning sist",
      value: `${stats.loseStreak.name}`,
      sub: `Tapte de siste ${stats.loseStreak.loseStreakLast} kampene forrige trening`,
    },*/
    stats.mostGames && {
      icon: "👑",
      label: "Flest kamper totalt",
      value: `${stats.mostGames.name}`,
      sub: `${stats.mostGames.games} kamper spilt`,
    },
    stats.fewestGames && stats.fewestGames.id !== stats.mostGames?.id && {
      icon: "🛋️",
      label: "Færrest kamper",
      value: `${stats.fewestGames.name}`,
      sub: `Bare ${stats.fewestGames.games} kamper — ta deg sammen!`,
    },
    stats.bestForm && {
      icon: "📈",
      label: "Best form siste 30 dager",
      value: `${stats.bestForm.name}`,
      sub: `${stats.bestForm.recentForm}% vinnprosent`,
    },
    /*stats.worstForm && stats.worstForm.id !== stats.bestForm?.id && {
      icon: "📉",
      label: "Dårligst form siste 30 dager",
      value: `${stats.worstForm.name}`,
      sub: `${stats.worstForm.recentForm}% vinnprosent`,
    },*/
    stats.bestCombo && {
      icon: "🤝",
      label: "Beste partnerkombo",
      value: stats.bestCombo.names,
      sub: `${stats.bestCombo.pct}% vinnprosent over ${stats.bestCombo.games} kamper`,
    },
    stats.worstCombo && {
      icon: "💔",
      label: "Verste partnerkombo",
      value: stats.worstCombo.names,
      sub: `${stats.worstCombo.pct}% vinnprosent over ${stats.worstCombo.games} kamper`,
    },
    stats.mostUnpred && {
      icon: "🎲",
      label: "Mest uforutsigbar spiller",
      value: `${stats.mostUnpred.name}`,
      sub: "Ingen vet hva som skjer neste kamp",
    },
    stats.deuceKing && stats.deuceKing.deuceWins > 0 && {
      icon: "⚡",
      label: "Deuce-kongen",
      value: `${stats.deuceKing.name}`,
      sub: `Vinner ${stats.deuceKing.deuceWins} tette kamper`,
    },
    stats.revengeKing && {
      icon: "😤",
      label: "Revansjekongen",
      value: `${stats.revengeKing.name}`,
      sub: `Hevner seg ${stats.revengeKing.revenge.pct}% av gangene etter et tap (${stats.revengeKing.revenge.successes}/${stats.revengeKing.revenge.attempts})`,
    },
    stats.bestAttendance && {
      icon: "📅",
      label: "Best oppmøte",
      value: `${stats.bestAttendance.name}`,
      sub: `${stats.bestAttendance.attendance.attended} av ${stats.bestAttendance.attendance.total} treninger (${stats.bestAttendance.attendance.pct}%)`,
    },
    stats.bestDefense && {
      icon: "🛡️",
      label: "Beste forsvar",
      value: `${stats.bestDefense.name}`,
      sub: `Slipper inn ${stats.bestDefense.defense} poeng for hvert poeng scoret`,
    },
  ].filter(Boolean);

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
