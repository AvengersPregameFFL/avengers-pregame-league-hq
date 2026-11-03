#!/usr/bin/env python3
"""Calculate weekly optimal PPR lineups from Sleeper's official public API."""
import csv, io, json, os, urllib.request
from datetime import datetime, timezone
from functools import lru_cache

LEAGUE = "1395849826633019392"
BASE = "https://api.sleeper.app/v1"
def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent":"AvengersPregameLeagueHQ/1.0"})
    with urllib.request.urlopen(req, timeout=90) as response:
        return json.load(response)

league = get("/league/" + LEAGUE)
slots = [p for p in league["roster_positions"] if p not in ("BN", "IR", "TAXI")]
players = get("/players/nfl")
rosters = get("/league/" + LEAGUE + "/rosters")
users = get("/league/" + LEAGUE + "/users")
names = {str(u["user_id"]): u.get("display_name", "") for u in users}
owners = {r["roster_id"]: names.get(str(r.get("owner_id")), "") for r in rosters}
settings = league.get("scoring_settings", {})
# Player points returned by Sleeper are already calculated using the league's scoring rules.
def eligible(player_id, slot):
    player = players.get(str(player_id), {})
    pos = player.get("fantasy_positions") or [player.get("position")]
    if slot == "SUPER_FLEX": return any(x in ("QB","RB","WR","TE") for x in pos)
    if slot == "FLEX": return any(x in ("RB","WR","TE") for x in pos)
    if slot == "WRRB_FLEX": return any(x in ("WR","RB") for x in pos)
    if slot == "REC_FLEX": return any(x in ("WR","TE") for x in pos)
    if slot == "IDP_FLEX": return any(x in ("DL","LB","DB","DE","DT","CB","S") for x in pos)
    return slot in pos or (slot == "DEF" and player.get("position") == "DEF")

def optimal(points, ids):
    candidates = [(pid, float(points.get(pid, 0) or 0)) for pid in dict.fromkeys(ids) if pid in players or pid in points]
    # Exact slot-to-player assignment; each player can fill at most one slot.
    options = [[i for i,(pid,_) in enumerate(candidates) if eligible(pid, slot)] for slot in slots]
    order = sorted(range(len(slots)), key=lambda j:len(options[j]))
    @lru_cache(None)
    def solve(k, used):
        if k == len(order): return 0.0
        possible = options[order[k]]
        if not possible: return solve(k+1, used)
        best = float("-inf")
        for i in possible:
            if not used >> i & 1:
                best = max(best, candidates[i][1] + solve(k+1, used | (1<<i)))
        return best if best != float("-inf") else solve(k+1, used)
    return round(solve(0,0), 2)

rows = []
for week in range(1,19):
    matchups = get(f"/league/{LEAGUE}/matchups/{week}")
    if not matchups: continue
    for m in matchups:
        pts = m.get("players_points") or {}
        ids = m.get("players") or []
        if not pts or not ids: continue
        actual = m.get("points")
        if actual is None: continue
        best = optimal(pts, ids)
        rows.append({"week":week,"roster_id":m["roster_id"],"manager":owners.get(m["roster_id"], ""),"actual":round(float(actual),2),"optimal":best,"efficiency":round(100*float(actual)/best,2) if best>0 else None})
rows.sort(key=lambda x:(x["week"],x["roster_id"]))
os.makedirs("data",exist_ok=True)
payload={"league_id":LEAGUE,"generated_at":datetime.now(timezone.utc).isoformat(),"roster_positions":slots,"source":"Sleeper public API matchup players_points","rows":rows}
with open("data/optimal-lineups.json","w") as f:json.dump(payload,f,indent=2)
with open("data/optimal-lineups.csv","w",newline="") as f:
    w=csv.writer(f);w.writerow(["Week","Roster ID","Manager","Actual","Optimal","Efficiency"])
    for r in rows:w.writerow([r["week"],r["roster_id"],r["manager"],r["actual"],r["optimal"],r["efficiency"]])
print(f"Generated {len(rows)} verified weekly optimal lineup records")
