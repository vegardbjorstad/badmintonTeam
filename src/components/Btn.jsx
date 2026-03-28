// src/components/Btn.jsx

export default function Btn({
  children,
  onClick,
  variant = "primary",
  style = {},
  disabled = false,
}) {
  const variants = {
    primary: {
      background: "linear-gradient(135deg,#38bdf8,#6366f1)",
      color: "#fff",
      fontSize: 20,
      height: 66,
    },
    success: {
      background: "linear-gradient(135deg,#16a34a,#15803d)",
      color: "#fff",
      fontSize: 20,
      height: 66,
    },
    warning: {
      background: "linear-gradient(135deg,#d97706,#b45309)",
      color: "#fff",
      fontSize: 18,
      height: 58,
    },
    danger: {
      background: "none",
      border: "2px solid #7f1d1d",
      color: "#ef4444",
      fontSize: 15,
      height: 50,
    },
    ghost: {
      background: "none",
      border: "2px solid #1e3a5f",
      color: "#94a3b8",
      fontSize: 15,
      height: 50,
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        border: "none",
        borderRadius: 14,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        letterSpacing: "0.06em",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
