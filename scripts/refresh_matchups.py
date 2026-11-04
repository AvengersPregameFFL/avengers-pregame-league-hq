#!/usr/bin/env python3
"""Read-only Sleeper matchup snapshot; retain last good snapshot on failure."""
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

LEAGUE = "1395849826633019392"
OUT = Path("data/sleeper-matchups.json")
BASE = "https://api.sleeper.app/v1"

def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "AvengersPregameLeagueHQ/1.0"})
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)

def main():
    existing = {}
    if OUT.exists():
        existing = json.loads(OUT.read_text())
    weeks = dict(existing.get("weeks", {}))
    rosters = get(f"/league/{LEAGUE}/rosters")
    users = get(f"/league/{LEAGUE}/users")
    state = get("/state/nfl")
    names = {u["user_id"]: (u.get("metadata") or {}).get("team_name") or u.get("display_name") or "Unknown" for u in users}
    team_names = {r["roster_id"]: names.get(r.get("owner_id"), f"Roster {r['roster_id']}") for r in rosters}
    current = int(state.get("week") or 9)
    targets = sorted({9, current, max(1, current - 1), min(18, current + 1)})
    updated = 0
    for week in targets:
        try:
            rows = get(f"/league/{LEAGUE}/matchups/{week}")
            groups = {}
            for row in rows:
                mid = row.get("matchup_id")
                if mid is not None:
                    groups.setdefault(str(mid), []).append(row)
            pairs = []
            for mid, group in sorted(groups.items(), key=lambda x: int(x[0])):
                if len(group) != 2:
                    continue
                a, b = group
                pairs.append({"matchup_id": int(mid), "teams": [
                    {"roster_id": p["roster_id"], "name": team_names[p["roster_id"]], "points": p.get("points", 0)}
                    for p in (a, b)]})
            if len(pairs) != 4 or len({t["roster_id"] for p in pairs for t in p["teams"]}) != 8:
                raise ValueError(f"Week {week}: expected 4 complete unique pairings")
            weeks[str(week)] = {"verified_at": datetime.now(timezone.utc).isoformat(), "matchups": pairs}
            updated += 1
        except Exception as exc:
            print(f"Week {week}: keeping prior verified snapshot ({exc})")
    if not updated and not weeks:
        raise RuntimeError("No verified matchups to publish")
    payload = {"league_id": LEAGUE, "schema_version": 1, "weeks": weeks}
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"Updated {updated} week(s); preserved {len(weeks)} total")

if __name__ == "__main__":
    main()
