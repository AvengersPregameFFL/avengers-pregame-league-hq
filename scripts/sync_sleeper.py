#!/usr/bin/env python3
"""Read-only Sleeper league roster and weekly lineup snapshot generator."""
import datetime as dt
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

LEAGUE = os.environ.get("SLEEPER_LEAGUE_ID", "1395849826633019392")
API = "https://api.sleeper.app/v1"
OUT = Path("data/sleeper-rosters.json")
TIMEOUT = 30

def get(path):
    req = Request(API + path, headers={"User-Agent": "AvengersPregameRosterSync/1.0", "Accept": "application/json"})
    with urlopen(req, timeout=TIMEOUT) as response:
        return json.load(response)

def main():
    league = get("/league/" + LEAGUE)
    if not isinstance(league, dict) or str(league.get("league_id")) != LEAGUE:
        raise RuntimeError("Sleeper league ID mismatch")
    users = get("/league/" + LEAGUE + "/users")
    rosters = get("/league/" + LEAGUE + "/rosters")
    players = get("/players/nfl")
    state = get("/state/nfl")
    if not isinstance(users, list) or not isinstance(rosters, list) or not isinstance(players, dict):
        raise RuntimeError("Invalid Sleeper API payload")
    owners = {str(u["user_id"]): u for u in users if u.get("user_id")}
    weeks = set()
    current = int(state.get("week") or 1)
    start = max(1, current - 1)
    end = min(18, current + 1)
    weeks.update(range(start, end + 1))
    matchup_by_week = {}
    for week in sorted(weeks):
        entries = get("/league/" + LEAGUE + "/matchups/" + str(week))
        if not isinstance(entries, list):
            raise RuntimeError("Invalid matchup payload for week " + str(week))
        matchup_by_week[str(week)] = entries
    ids = set()
    for roster in rosters:
        ids.update(roster.get("players") or [])
        ids.update(roster.get("starters") or [])
        ids.update(roster.get("reserve") or [])
        ids.update(roster.get("taxi") or [])
    for entries in matchup_by_week.values():
        for entry in entries:
            ids.update(entry.get("players") or [])
            ids.update(entry.get("starters") or [])
    player_map = {}
    for pid in sorted(ids):
        p = players.get(str(pid)) or {}
        player_map[str(pid)] = {
            "name": p.get("full_name") or " ".join(filter(None, [p.get("first_name"), p.get("last_name")])) or str(pid),
            "team": p.get("team"),
            "position": p.get("position"),
            "status": p.get("status"),
        }
    roster_map = {}
    for roster in rosters:
        rid = str(roster["roster_id"])
        owner = owners.get(str(roster.get("owner_id"))) or {}
        meta = owner.get("metadata") or {}
        roster_map[rid] = {
            "roster_id": roster["roster_id"],
            "owner_id": roster.get("owner_id"),
            "manager": owner.get("display_name") or owner.get("username") or "Unknown",
            "team_name": meta.get("team_name") or "",
            "players": roster.get("players") or [],
            "starters": roster.get("starters") or [],
            "reserve": roster.get("reserve") or [],
            "taxi": roster.get("taxi") or [],
        }
    weekly = {}
    for week, entries in matchup_by_week.items():
        weekly[week] = [{
            "roster_id": e.get("roster_id"),
            "matchup_id": e.get("matchup_id"),
            "starters": e.get("starters") or [],
            "players": e.get("players") or [],
            "points": e.get("points"),
            "starters_points": e.get("starters_points") or [],
        } for e in entries]
    snapshot = {
        "schema_version": 1,
        "source": "Sleeper public API",
        "league_id": LEAGUE,
        "season": league.get("season"),
        "league_name": league.get("name"),
        "current_nfl_week": current,
        "generated_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "weekly_matchup_weeks": sorted(weeks),
        "rosters": roster_map,
        "players": player_map,
        "weekly_matchups": weekly,
        "notes": "Current roster ownership is live at sync time. Weekly matchups retain the starters recorded by Sleeper for each requested week; historical ownership may differ."
    }
    if not roster_map or not player_map:
        raise RuntimeError("Empty roster/player data; refusing to publish")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix(".tmp")
    tmp.write_text(json.dumps(snapshot, indent=2, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(OUT)
    print("Synced", len(roster_map), "rosters,", len(player_map), "players, weeks", sorted(weeks))

if __name__ == "__main__":
    main()
