// src/screens/Admin.jsx
//
// Tab: Innstillinger
// Samler push-varsler, treningstider og klubbinnstillinger.

import { useState } from "react";
import Label from "../components/Label";

const fmtTraining = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })
    + " kl. " + d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
};

const DAYS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

export default function Admin({
  push,
  club,
  nextTraining,
  onSaveTraining,
  onSaveClubName,
  onSavePin,
  trainingDefaults,
  onAddTrainingDefault,
  onUpdateTrainingDefault,
  onDeleteTrainingDefault,
}) {
  const [showPinForm, setShowPinForm]     = useState(false);
  const [showNameForm, setShowNameForm]   = useState(false);
  const [newPin, setNewPin]               = useState("");
  const [newPin2, setNewPin2]             = useState("");
  const [newName, setNewName]             = useState("");
  const [pinError, setPinError]           = useState("");
  const [editingId, setEditingId]         = useState(null);
  const [editDay, setEditDay]             = useState(0);
  const [editTime, setEditTime]           = useState("18:00");
  const [showAddForm, setShowAddForm]     = useState(false);
  const [addDay, setAddDay]               = useState(0);
  const [addTime, setAddTime]             = useState("18:00");

  function handleSavePin() {
    if (newPin.length < 4) { setPinError("PIN må være minst 4 tegn"); return; }
    if (newPin !== newPin2) { setPinError("PIN-kodene er ikke like"); return; }
    onSavePin(newPin);
    setNewPin(""); setNewPin2(""); setPinError("");
    setShowPinForm(false);
  }

  function handleSaveName() {
    if (!newName.trim()) return;
    onSaveClubName(newName.trim());
    setNewName("");
    setShowNameForm(false);
  }

  return (
    <div style={{ padding: "20px 16px" }}>

      {/* ── PUSH-VARSLER ───────────────────────────────────────────────── */}
      <Label>PUSH-VARSLER</Label>
      <div style={{ background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: push.subscribed ? 14 : 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>
              {push.subscribed ? "Varsler er på" : "Varsler er av"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {push.subscribed
                ? "Du får påminnelse før trening og stats etterpå"
                : push.permission === "denied"
                ? "Blokkert i nettleserinnstillinger"
                : "Skru på for å få treningsvarsler"}
            </div>
          </div>
          <button
            onClick={push.subscribed ? push.unsubscribe : push.subscribe}
            disabled={push.loading || push.permission === "denied"}
            style={{
              height: 40, padding: "0 16px", borderRadius: 10, border: "none",
              background: push.subscribed ? "#1e293b" : "linear-gradient(135deg,#38bdf8,#6366f1)",
              color: push.subscribed ? "#64748b" : "#fff",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700, fontSize: 14, letterSpacing: "0.04em",
              cursor: push.loading || push.permission === "denied" ? "default" : "pointer",
              opacity: push.loading ? 0.6 : 1, flexShrink: 0,
            }}
          >
            {push.loading ? "..." : push.subscribed ? "Skru av" : "Skru på"}
          </button>
        </div>

        {push.subscribed && (
          <div>
            <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>
              NESTE TRENING
            </div>
            {nextTraining ? (
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>
                📅 {fmtTraining(nextTraining)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>Ingen trening satt ennå</div>
            )}
            <input
              type="datetime-local"
              onChange={(e) => e.target.value && onSaveTraining(e.target.value)}
              style={{
                width: "100%", height: 44, borderRadius: 10,
                border: "2px solid #1e3a5f", background: "#020617",
                color: "#f8fafc", fontSize: 14, padding: "0 12px",
                outline: "none", fontFamily: "'Barlow',sans-serif",
                boxSizing: "border-box", colorScheme: "dark",
              }}
            />
            <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
              Alle i klubben får påminnelse 2 timer før
            </div>
          </div>
        )}
      </div>

      {/* ── DEFAULT TRENINGSTIDER ──────────────────────────────────────── */}
      <Label>DEFAULT TRENINGSTIDER</Label>
      <div style={{ background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          Brukes automatisk når neste trening ikke er satt manuelt.
        </div>

        {/* Liste over eksisterende */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {(trainingDefaults || []).length === 0 && (
            <div style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "12px 0" }}>
              Ingen treningsdager lagt til ennå
            </div>
          )}
          {(trainingDefaults || []).map((t) => (
            <div key={t.id}>
              {editingId === t.id ? (
                // Redigeringsrad
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={editDay}
                    onChange={(e) => setEditDay(Number(e.target.value))}
                    style={{ flex: 1, height: 44, borderRadius: 10, border: "2px solid #38bdf8", background: "#020617", color: "#f8fafc", fontSize: 14, padding: "0 8px", outline: "none", fontFamily: "'Barlow',sans-serif" }}
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    style={{ width: 90, height: 44, borderRadius: 10, border: "2px solid #38bdf8", background: "#020617", color: "#f8fafc", fontSize: 14, padding: "0 8px", outline: "none", fontFamily: "'Barlow',sans-serif", colorScheme: "dark" }}
                  />
                  <button
                    onClick={() => { onUpdateTrainingDefault(t.id, editDay, editTime); setEditingId(null); }}
                    style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "2px solid #1e3a5f", background: "none", color: "#64748b", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                // Visningsrad
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0a1628", borderRadius: 10, border: "1px solid #1e3a5f" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>{DAYS[t.day_of_week]}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: "#38bdf8" }}>
                    {t.start_time.slice(0, 5)}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => { setEditingId(t.id); setEditDay(t.day_of_week); setEditTime(t.start_time.slice(0, 5)); }}
                      style={{ background: "none", border: "2px solid #1e3a5f", borderRadius: 8, color: "#64748b", padding: "4px 10px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12 }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteTrainingDefault(t.id)}
                      style={{ background: "none", border: "2px solid #7f1d1d", borderRadius: 8, color: "#ef4444", padding: "4px 10px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legg til ny */}
        {showAddForm ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={addDay}
              onChange={(e) => setAddDay(Number(e.target.value))}
              style={{ flex: 1, height: 44, borderRadius: 10, border: "2px solid #38bdf8", background: "#020617", color: "#f8fafc", fontSize: 14, padding: "0 8px", outline: "none", fontFamily: "'Barlow',sans-serif" }}
            >
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input
              type="time"
              value={addTime}
              onChange={(e) => setAddTime(e.target.value)}
              style={{ width: 90, height: 44, borderRadius: 10, border: "2px solid #38bdf8", background: "#020617", color: "#f8fafc", fontSize: 14, padding: "0 8px", outline: "none", fontFamily: "'Barlow',sans-serif", colorScheme: "dark" }}
            />
            <button
              onClick={() => { onAddTrainingDefault(addDay, addTime); setShowAddForm(false); }}
              style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              ✓
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "2px solid #1e3a5f", background: "none", color: "#64748b", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            style={{ width: "100%", height: 42, borderRadius: 10, border: "2px dashed #1e3a5f", background: "none", color: "#475569", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: "0.06em" }}
          >
            + LEGG TIL TRENINGSDAG
          </button>
        )}
      </div>

      {/* ── KLUBBINNSTILLINGER ─────────────────────────────────────────── */}
      <Label>KLUBBINNSTILLINGER</Label>
      <div style={{ background: "#0f172a", border: "2px solid #1e3a5f", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>

        {/* Klubbnavn */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showNameForm ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.08em" }}>KLUBBNAVN</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", marginTop: 2 }}>{club?.name}</div>
            </div>
            <button
              onClick={() => { setShowNameForm(!showNameForm); setNewName(club?.name || ""); }}
              style={{ background: "none", border: "2px solid #1e3a5f", borderRadius: 10, color: "#64748b", padding: "6px 12px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13 }}
            >
              Endre
            </button>
          </div>
          {showNameForm && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
                style={{ flex: 1, height: 44, borderRadius: 10, border: "2px solid #38bdf8", background: "#020617", color: "#f8fafc", fontSize: 15, padding: "0 12px", outline: "none", fontFamily: "'Barlow',sans-serif" }}
              />
              <button
                onClick={handleSaveName}
                disabled={!newName.trim()}
                style={{ height: 44, padding: "0 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Lagre
              </button>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "#1e3a5f", marginBottom: 16 }} />

        {/* PIN-kode */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showPinForm ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.08em" }}>PIN-KODE</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", marginTop: 2 }}>••••</div>
            </div>
            <button
              onClick={() => { setShowPinForm(!showPinForm); setNewPin(""); setNewPin2(""); setPinError(""); }}
              style={{ background: "none", border: "2px solid #1e3a5f", borderRadius: 10, color: "#64748b", padding: "6px 12px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13 }}
            >
              Endre
            </button>
          </div>
          {showPinForm && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Ny PIN-kode"
                autoFocus
                style={{ height: 44, borderRadius: 10, border: "2px solid #1e3a5f", background: "#020617", color: "#f8fafc", fontSize: 15, padding: "0 12px", outline: "none", fontFamily: "'Barlow',sans-serif" }}
              />
              <input
                type="password"
                value={newPin2}
                onChange={(e) => setNewPin2(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSavePin()}
                placeholder="Gjenta PIN-kode"
                style={{ height: 44, borderRadius: 10, border: `2px solid ${pinError ? "#ef4444" : "#1e3a5f"}`, background: "#020617", color: "#f8fafc", fontSize: 15, padding: "0 12px", outline: "none", fontFamily: "'Barlow',sans-serif" }}
              />
              {pinError && <div style={{ fontSize: 12, color: "#ef4444" }}>{pinError}</div>}
              <button
                onClick={handleSavePin}
                style={{ height: 44, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
              >
                Lagre PIN
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
