"""
Garmin Connect – øktdata for badminton
Henter: puls, pulssoner, kalorier og treningseffekt direkte fra aktiviteten.

Krever: pip install garminconnect

Bruk:
    python garmin_session.py

Første gang: logger inn og lagrer token til ~/.garminconnect
Neste gang:  laster token automatisk (ingen passord nødvendig)
"""

import os
import json
from datetime import datetime
from garminconnect import Garmin

TOKEN_PATH = os.path.expanduser("~/.garminconnect")


# ── Innlogging ──────────────────────────────────────────────────────────────

def get_client() -> Garmin:
    """Returner en innlogget Garmin-klient. Bruker lagret token hvis mulig."""
    email = os.getenv("GARMIN_EMAIL")
    password = os.getenv("GARMIN_PASSWORD")

    if not email or not password:
        email = input("Garmin e-post: ").strip()
        password = input("Garmin passord: ").strip()

    client = Garmin(
        email,
        password,
        prompt_mfa=lambda: input("MFA-kode (la stå tom hvis ikke i bruk): ").strip() or None,
    )
    client.login(TOKEN_PATH)
    return client


# ── Hjelpe-funksjoner ───────────────────────────────────────────────────────

def bpm_zone(bpm: int) -> str:
    """Enkel pulssone-klassifisering (5-soners modell)."""
    if bpm < 114:   return "Sone 1 – veldig lett"
    elif bpm < 133: return "Sone 2 – lett"
    elif bpm < 152: return "Sone 3 – moderat"
    elif bpm < 171: return "Sone 4 – hard"
    else:           return "Sone 5 – maks"


def format_duration(seconds: int) -> str:
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    return f"{h}t {m}min" if h else f"{m}min {s}s"


def safe_int(val) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0


def safe_float(val, decimals: int = 1):
    try:
        return round(float(val), decimals)
    except (TypeError, ValueError):
        return None


def _te_label(score: float) -> str:
    """Oversett Garmin treningseffekt-score (0–5) til norsk tekst."""
    if score < 1.0:   return "Ingen effekt"
    elif score < 2.0: return "Liten effekt"
    elif score < 3.0: return "Vedlikeholder"
    elif score < 4.0: return "Forbedrer"
    elif score < 4.5: return "Høy effekt"
    else:             return "Overbelastende"


# ── Hent aktivitetsliste ────────────────────────────────────────────────────

def fetch_recent_activities(client: Garmin, limit: int = 15) -> list:
    return client.get_activities(0, limit)


def pick_activity(activities: list):
    if not activities:
        print("Ingen aktiviteter funnet.")
        return None

    print("\n── Siste aktiviteter ─────────────────────────────────────────")
    for i, act in enumerate(activities):
        name   = act.get("activityName", "Ukjent")
        sport  = act.get("activityType", {}).get("typeKey", "")
        start  = act.get("startTimeLocal", "")[:16]
        dur    = format_duration(safe_int(act.get("duration", 0)))
        avg_hr = safe_int(act.get("averageHR", 0))
        hr_str = f"  ♥ {avg_hr} bpm" if avg_hr else ""
        print(f"  [{i+1}] {start}  {name} ({sport})  {dur}{hr_str}")

    print("  [0] Avbryt")
    print("──────────────────────────────────────────────────────────────")

    while True:
        try:
            choice = int(input("Velg aktivitet (nummer): "))
            if choice == 0:
                return None
            if 1 <= choice <= len(activities):
                return activities[choice - 1]
        except ValueError:
            pass
        print(f"Skriv et tall mellom 0 og {len(activities)}.")


# ── Hent øktdetaljer ────────────────────────────────────────────────────────

def fetch_session_data(client: Garmin, activity: dict) -> dict:
    """
    Henter all relevant øktdata direkte fra aktiviteten:
      - Puls (snitt, maks, tidsserie)
      - Pulssoner (tid i hver sone)
      - Kalorier
      - Treningseffekt aerob + anaerob (0.0–5.0)
      - Treningsbelastning
    """
    activity_id = activity.get("activityId")
    details = client.get_activity(activity_id)

    session = {
        "activity_id":  activity_id,
        "name":         activity.get("activityName"),
        "sport":        activity.get("activityType", {}).get("typeKey"),
        "start":        activity.get("startTimeLocal"),
        "duration_s":   safe_int(activity.get("duration", 0)),
        "calories":     safe_int(activity.get("calories", 0)),
        "heart_rate": {
            "avg_bpm":      safe_int(activity.get("averageHR", 0)),
            "max_bpm":      safe_int(activity.get("maxHR", 0)),
            "zone_summary": {},
            "samples":      [],
        },
        "training_effect": {
            "aerobic":         None,
            "anaerobic":       None,
            "aerobic_label":   None,
            "anaerobic_label": None,
        },
        "training_load": None,
        "exported_at":  datetime.now().isoformat(),
    }

    # ── Treningseffekt ──────────────────────────────────────────────────────
    ae  = safe_float(details.get("aerobicTrainingEffect"))
    ane = safe_float(details.get("anaerobicTrainingEffect"))
    if ae is not None:
        session["training_effect"]["aerobic"]       = ae
        session["training_effect"]["aerobic_label"] = _te_label(ae)
    if ane is not None:
        session["training_effect"]["anaerobic"]       = ane
        session["training_effect"]["anaerobic_label"] = _te_label(ane)

    # Treningsbelastning
    tl = safe_float(details.get("trainingLoad") or details.get("activityTrainingLoad"))
    if tl is not None:
        session["training_load"] = tl

    # ── Pulssoner ───────────────────────────────────────────────────────────
    for zone in details.get("heartRateZones", []):
        zone_name = zone.get("zoneName") or f"Sone {zone.get('zoneNumber', '?')}"
        session["heart_rate"]["zone_summary"][zone_name] = {
            "seconds": safe_int(zone.get("secsInZone", 0)),
            "low_bpm": safe_int(zone.get("zoneLowBoundary", 0)),
        }

    # ── Pulstidsserie ───────────────────────────────────────────────────────
    descriptors  = details.get("metricDescriptors", [])
    metrics_data = details.get("activityDetailMetrics", [])

    hr_idx = ts_idx = None
    for desc in descriptors:
        key = desc.get("metricsType", "").lower()
        idx = desc.get("metricsIndex", -1)
        if key == "heart_rate":         hr_idx = idx
        elif key == "elapsed_duration": ts_idx = idx

    if hr_idx is not None:
        for point in metrics_data:
            vals = point.get("metrics", [])
            try:
                bpm     = int(vals[hr_idx]) if vals[hr_idx] else None
                elapsed = int(vals[ts_idx]) if ts_idx is not None and vals[ts_idx] else None
                if bpm and bpm > 30:
                    session["heart_rate"]["samples"].append({
                        "elapsed_s": elapsed,
                        "bpm":       bpm,
                        "zone":      bpm_zone(bpm),
                    })
            except (IndexError, TypeError):
                continue

    return session


# ── Rapport ─────────────────────────────────────────────────────────────────

def print_session_report(session: dict):
    hr = session["heart_rate"]
    te = session["training_effect"]

    print("\n" + "═" * 56)
    print(f"  {session['name']}  ({session['sport']})")
    print("═" * 56)
    print(f"  Dato:        {session['start'][:16]}")
    print(f"  Varighet:    {format_duration(session['duration_s'])}")
    print(f"  Kalorier:    {session['calories']} kcal")
    if session["training_load"] is not None:
        print(f"  Belastning:  {session['training_load']}")

    # Treningseffekt
    print("\n  ── Treningseffekt ─────────────────────────────────────")
    if te["aerobic"] is not None:
        print(f"  Aerob:       {te['aerobic']:.1f} / 5.0  →  {te['aerobic_label']}")
    if te["anaerobic"] is not None:
        print(f"  Anaerob:     {te['anaerobic']:.1f} / 5.0  →  {te['anaerobic_label']}")
    if te["aerobic"] is None and te["anaerobic"] is None:
        print("  Ikke tilgjengelig for denne aktivitetstypen.")

    # Puls
    print("\n  ── Puls ───────────────────────────────────────────────")
    if hr["avg_bpm"]:
        print(f"  Snitt:       {hr['avg_bpm']} bpm  ({bpm_zone(hr['avg_bpm'])})")
        print(f"  Maks:        {hr['max_bpm']} bpm")
    else:
        print("  Ingen pulsdata tilgjengelig.")

    # Pulssoner med prosentbar
    if hr["zone_summary"]:
        dur = session["duration_s"] or 1
        print("\n  Tid i pulssoner:")
        for zone_name, data in hr["zone_summary"].items():
            secs = data["seconds"]
            if secs > 0:
                pct = secs / dur * 100
                bar = "█" * int(pct / 4)
                print(f"    {zone_name:<22} {format_duration(secs):>10}  {bar} {pct:.0f}%")

    # ASCII pulskurve
    if hr["samples"]:
        bpm_list = [s["bpm"] for s in hr["samples"]]
        print(f"\n  Pulskurve ({len(bpm_list)} punkter):")
        min_bpm, max_bpm = min(bpm_list), max(bpm_list)
        step    = max(1, len(bpm_list) // 50)
        sampled = bpm_list[::step][:50]
        height  = 6
        print("  ┌" + "─" * len(sampled) + "┐")
        for row in range(height, 0, -1):
            threshold = min_bpm + (max_bpm - min_bpm) * (row / height)
            line = "  │" + "".join("█" if v >= threshold else " " for v in sampled) + "│"
            if row == height: line += f" {max_bpm} bpm"
            if row == 1:      line += f" {min_bpm} bpm"
            print(line)
        print("  └" + "─" * len(sampled) + "┘")

    print("═" * 56)


def save_session_json(session: dict, path: str):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(session, f, ensure_ascii=False, indent=2)
    print(f"\n  Data lagret → {path}")


# ── Hovedprogram ────────────────────────────────────────────────────────────

def main():
    print("╔════════════════════════════════════════════════════════╗")
    print("║   Garmin → Badmintonapp  –  Øktdata                   ║")
    print("╚════════════════════════════════════════════════════════╝")

    client = get_client()
    print("\nInnlogget ✓  Henter aktiviteter...")

    activities = fetch_recent_activities(client)
    activity   = pick_activity(activities)
    if not activity:
        print("Avbryt.")
        return

    print("\nHenter øktdata fra Garmin...")
    session = fetch_session_data(client, activity)

    print_session_report(session)

    save = input("\nLagre som JSON? (j/n): ").strip().lower()
    if save == "j":
        filename = f"garmin_session_{session['activity_id']}.json"
        save_session_json(session, filename)


if __name__ == "__main__":
    main()
