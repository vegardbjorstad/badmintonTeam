// src/components/Toast.jsx

export default function Toast({ toast }) {
  if (!toast) return null;

  const bg =
    {
      error: "#dc2626",
      success: "#16a34a",
      info: "#1e40af",
      warning: "#d97706",
    }[toast.type] || "#1e40af";

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: bg,
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 15,
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      {toast.msg}
    </div>
  );
}