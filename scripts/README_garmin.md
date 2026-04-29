# Garmin → Badmintonapp – puls & skrittdata

## Installasjon

```bash
pip install garminconnect
```

## Kjøring

```bash
python garmin_session.py
```

Første gang spør scriptet om e-post og passord. Token lagres i `~/.garminconnect`
– neste gang logger det inn automatisk uten passord.

Du kan også sette miljøvariabler for å unngå manuell innskriving:
```bash
export GARMIN_EMAIL="din@epost.no"
export GARMIN_PASSWORD="dittpassord"
```

## Hva scriptet gjør

1. Logger inn mot Garmin Connect
2. Viser dine 15 siste aktiviteter
3. Du velger én aktivitet
4. Henter:
   - Gjennomsnittspuls og makspuls
   - Tid i pulssoner (Sone 1–5)
   - Pulskurve over tid (tidsserie med datapunkter)
   - Daglig skrittdata for aktivitetens dato
5. Skriver ut en rapport i terminalen med ASCII-pulsgraf
6. Tilbyr å lagre alt som JSON

## JSON-output (eksempel)

```json
{
  "activity_id": 12345678,
  "name": "Badminton",
  "sport": "racket_sports",
  "start": "2025-03-15 18:30:00",
  "duration_s": 3600,
  "calories": 520,
  "heart_rate": {
    "avg_bpm": 142,
    "max_bpm": 178,
    "zone_summary": {
      "Zone 1": 120,
      "Zone 2": 480,
      "Zone 3": 900,
      "Zone 4": 1560,
      "Zone 5": 540
    },
    "samples": [
      { "elapsed_s": 0, "bpm": 98, "zone": "Sone 1 – veldig lett" },
      { "elapsed_s": 30, "bpm": 121, "zone": "Sone 2 – lett" }
    ]
  },
  "steps": {
    "date": "2025-03-15",
    "total": 12430
  }
}
```

## Koble til badmintonappen

JSON-filen kan importeres direkte til appen og knyttes til en kamp:

```python
import json

with open("garmin_session_12345678.json") as f:
    session = json.load(f)

avg_hr = session["heart_rate"]["avg_bpm"]   # 142
max_hr = session["heart_rate"]["max_bpm"]   # 178
steps  = session["steps"]["total"]          # 12430
```

## Neste steg

- Automatisk matching av Garmin-økt til badmintonkamp basert på tidspunkt
- Sammenligning av snittspuls mot ulike motstandere over tid
- Belastningstrend over treningssesong
