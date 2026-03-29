// src/components/ScoreBig.jsx

export default function ScoreBig({ value, onChange, win }) {
  const handleInput = (e) => {
    const raw = e.target.value.replace(/\D/g, ""); // bare siffer
    if (raw === "") { onChange(0); return; }
    const num = Math.min(99, parseInt(raw, 10));
    onChange(num);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* Pluss-knapp */}
      <button
        onClick={() => onChange(Math.min(99, value + 1))}
        style={{
          width: 62,
          height: 52,
          borderRadius: 12,
          fontSize: 26,
          fontWeight: 700,
          background: "#1e3a5f",
          border: "none",
          color: "#38bdf8",
          cursor: "pointer",
        }}
      >
        +
      </button>

      {/* Tallboks — trykk for å taste inn */}
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleInput}
        onFocus={(e) => e.target.select()}
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          textAlign: "center",
          fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: 40,
          fontWeight: 800,
          background: win ? "rgba(22,163,74,0.15)" : "#0f172a",
          border: `3px solid ${win ? "#16a34a" : "#1e3a5f"}`,
          color: win ? "#16a34a" : "#f8fafc",
          transition: "all 0.2s",
          outline: "none",
          MozAppearance: "textfield",
          cursor: "text",
        }}
      />

      {/* Minus-knapp */}
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 62,
          height: 52,
          borderRadius: 12,
          fontSize: 30,
          fontWeight: 700,
          background: "#0f172a",
          border: "2px solid #1e3a5f",
          color: "#64748b",
          cursor: "pointer",
        }}
      >
        −
      </button>
    </div>
  );
}
