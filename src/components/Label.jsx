// src/components/Label.jsx

export default function Label({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: "#475569",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
