#!/usr/bin/env python3
"""Read-only health audit of committed league snapshots; no network or writes."""
import json
from datetime import datetime, timezone
from pathlib import Path

LEAGUE_ID = "1395849826633019392"
def load(path):
    with Path(path).open(encoding="utf-8") as f:
        return json.load(f)

def age_hours(timestamp):
    return (datetime.now(timezone.utc) - datetime.fromisoformat(timestamp.replace("Z", "+00:00"))).total_seconds() / 3600

def check():
    problems = []
    reports = []
    try:
        roster = load("data/sleeper-rosters.json")
        assert str(roster.get("league_id")) == LEAGUE_ID, "roster league mismatch"
        assert isinstance(roster.get("rosters"), dict) and len(roster["rosters"]) == 8, "expected 8 rosters"
        assert isinstance(roster.get("weekly_matchups"), dict), "missing weekly matchups"
        age = age_hours(roster["generated_at_utc"])
        reports.append(f"Roster snapshot: {age:.1f} hours old; {len(roster['rosters'])} rosters")
        if age > 3: problems.append("Roster snapshot older than 3 hours")
    except (OSError, ValueError, KeyError, AssertionError, TypeError) as exc:
        problems.append(f"Roster snapshot invalid: {exc}")
    try:
        optimal = load("data/optimal-lineups.json")
        assert str(optimal.get("league_id")) == LEAGUE_ID, "optimal league mismatch"
        rows = optimal["rows"]
        assert isinstance(rows, list) and rows, "empty optimal rows"
        assert len({(r["week"], r["roster_id"]) for r in rows}) == len(rows), "duplicate roster/week"
        assert all(float(r["optimal"]) + 0.02 >= float(r["actual"]) for r in rows), "optimal below actual"
        age = age_hours(optimal["generated_at"])
        reports.append(f"Optimal lineups: {age:.1f} hours old; {len(rows)} records")
        if age > 30: problems.append("Optimal lineups older than 30 hours")
    except (OSError, ValueError, KeyError, AssertionError, TypeError) as exc:
        problems.append(f"Optimal lineup data invalid: {exc}")
    for line in reports: print(line)
    if problems:
        for item in problems: print("ERROR:", item)
        raise SystemExit(1)
    print("PASS: committed snapshot health")
if __name__ == "__main__":
    check()
