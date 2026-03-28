// src/components/Avatar.jsx

// Fargene brukes for avatar-bakgrunn og følger samme rekkefølge som i originalen
const COLORS = [
  "#f97316",
  "#6366f1",
  "#10b981",
  "#f43f5e",
  "#3b82f6",
  "#a855f7",
  "#eab308",
  "#14b8a6",
];

// Henter initialer fra navn (“Vegard Bjørstad” -> “VB”)
const getInitials = (name) =>
  name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function Avatar({ name, size = 44, colorIndex = 0 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: COLORS[colorIndex % COLORS.length],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.36,
        color: "#fff",
        flexShrink: 0,
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: "0.04em",
      }}
    >
      {getInitials(name)}
    </div>
  );
}