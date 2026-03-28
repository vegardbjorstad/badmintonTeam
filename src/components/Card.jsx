// src/components/Card.jsx

export default function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "2px solid #1e3a5f",
        borderRadius: 18,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}