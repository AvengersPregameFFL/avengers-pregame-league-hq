#!/usr/bin/env python3
"""Rebuild the public record book from finalized Sleeper matchups."""
import datetime as dt
import json
import os
from collections import defaultdict
from pathlib import Path
from urllib.request import Request, urlopen

LEAGUE = os.getenv("SLEEPER_LEAGUE_ID", "1395849826633019392")
API = "https://api.sleeper.app/v1"
OUT = Path("data/record-book.json")

def get(path):
    with urlopen(Request(API + path, headers={"User-Agent":"AvengersPregameRecords/1.0"}), timeout=30) as response:
        return json.load(response)

def main():
    league = get("/league/" + LEAGUE)
    rosters = get("/league/" + LEAGUE + "/rosters")
    users = {str(u["user_id"]):u for u in get("/league/" + LEAGUE + "/users")}
    if str(league.get("league_id")) != LEAGUE or len(rosters) != 8:
        raise RuntimeError("Unexpected Sleeper league or roster count")
    display_names = {"Dk25313":"DK","noreilly1993":"Nick","InfinityBrocklet":"Mike","Mexipez1999":"Aaron","hboogie1003":"Hunter","fondlerballer":"Jake","TGriffy93":"Travis","dentalhygenius":"Alyssa"}
    managers = {}
    for roster in rosters:
        owner = users.get(str(roster.get("owner_id")), {})
        managers[int(roster["roster_id"])] = (
            display_names.get(owner.get("display_name")) or display_names.get(owner.get("username")) or "Unknown",
            (owner.get("metadata") or {}).get("team_name") or "Team " + str(roster["roster_id"])
        )
    # Sleeper NFL state can omit previous_week. Derive the completed-week
    # horizon from actual matchups, never from a missing state value.
    try:
        state = get("/state/nfl")
    except Exception:
        state = {}
    current = int(state.get("week") or 0)
    previous = int(state.get("previous_week") or 0)
    max_week = min(18, int((league.get("settings") or {}).get("playoff_week_start") or 15) - 1)
    # The Sleeper previous_week field can lag the completed NFL slate.
    # On Nov 4, 2026, Week 9 is completed; do not cap the feed at stale Week 8.
    # For subsequent weeks, use the current-week boundary when available.
    completed_floor = 9 if int(league.get("season") or 0) == 2026 and dt.datetime.now(dt.timezone.utc).date() >= dt.date(2026, 11, 4) else 0
    if current > 1:
        max_week = min(max_week, max(current - 1, completed_floor))
    elif previous > 0:
        max_week = min(max_week, max(previous, completed_floor))
    last = 0
    for candidate in range(1, max_week + 1):
        entries = get(f"/league/{LEAGUE}/matchups/{candidate}")
        if len(entries) != len(managers):
            break
        if any(e.get("points") is None or e.get("matchup_id") is None for e in entries):
            break
        if len({e["matchup_id"] for e in entries}) != 4:
            break
        if not any(float(e.get("points") or 0) > 0 for e in entries):
            break
        last = candidate
    if last < 1:
        raise RuntimeError("No completed matchup weeks found in Sleeper league data")
    scores = defaultdict(list)
    wins = defaultdict(int)
    losses = defaultdict(int)
    points_for = defaultdict(float)
    points_against = defaultdict(float)
    allplay = defaultdict(int)
    weekly = []
    for week in range(1, last + 1):
        entries = get(f"/league/{LEAGUE}/matchups/{week}")
        if len(entries) != len(managers):
            raise RuntimeError(f"Week {week}: incomplete matchup roster count")
        by_id = {int(e["roster_id"]):e for e in entries}
        if set(by_id) != set(managers):
            raise RuntimeError(f"Week {week}: roster mismatch")
        grouped = defaultdict(list)
        for rid, entry in by_id.items():
            if entry.get("points") is None or entry.get("matchup_id") is None:
                raise RuntimeError(f"Week {week}: incomplete matchup")
            grouped[str(entry["matchup_id"])].append(rid)
        if len(grouped) != 4 or any(len(pair) != 2 for pair in grouped.values()):
            raise RuntimeError(f"Week {week}: invalid matchup pairs")
        for rid, entry in by_id.items():
            value = round(float(entry["points"]), 2)
            scores[rid].append(value)
            points_for[rid] += value
            allplay[rid] += sum(value > float(other["points"]) for oid,other in by_id.items() if oid != rid)
        for pair in grouped.values():
            a,b = pair
            pa,pb = scores[a][-1],scores[b][-1]
            points_against[a] += pb
            points_against[b] += pa
            if pa > pb:
                wins[a] += 1; losses[b] += 1
            elif pb > pa:
                wins[b] += 1; losses[a] += 1
        weekly.append((week,grouped))
    rows = [["RECORD BOOK"],[f"{league.get('season')} SEASON — THROUGH WEEK {last}"],
            ["Scope","Category","Record","Holder(s)","Team(s)","Value","Unit","Week(s)","Details","Definition / rule"]]
    def add(scope, category, label, candidates, mode, unit, week_label, detail=""):
        if not candidates: return
        target = (max if mode == "max" else min)(v for _,v,_ in candidates)
        tied = [(rid,note) for rid,v,note in candidates if abs(v-target) < 0.00001]
        holders = " / ".join(managers[rid][0] for rid,_ in tied)
        teams = " / ".join(managers[rid][1] for rid,_ in tied)
        notes = "; ".join(note for _,note in tied if note)
        rows.append([scope,category,label,holders,teams,round(target,2),unit,notes or week_label,detail,"Calculated from finalized Sleeper matchups"])
    ids = list(managers)
    allweeks = f"Weeks 1–{last}"
    add("Season to date","Cumulative","Most head-to-head wins",[(r,wins[r],"") for r in ids],"max","wins",allweeks)
    for result,label in (("W","Longest winning streak"),("L","Longest losing streak")):
        candidates=[]
        for r in ids:
            seq=[]
            for w,groups in weekly:
                pair=next(p for p in groups.values() if r in p)
                other=next(x for x in pair if x != r)
                seq.append("W" if scores[r][w-1]>scores[other][w-1] else "L" if scores[r][w-1]<scores[other][w-1] else "T")
            best=0;start=0;run=0;begin=0
            for i,v in enumerate(seq):
                if v==result:
                    if not run: begin=i+1
                    run+=1
                    if run>best:best=run;start=begin
                else:run=0
            candidates.append((r,best,f"W{start}–W{start+best-1}" if best else ""))
        add("Season to date","Cumulative",label,candidates,"max","games",allweeks)
    for label,values,mode,unit in [
        ("Most fantasy points scored",points_for,"max","pts"),
        ("Fewest fantasy points scored",points_for,"min","pts"),
        ("Most points allowed",points_against,"max","pts"),
        ("Fewest points allowed",points_against,"min","pts"),
        ("Best point differential",{r:points_for[r]-points_against[r] for r in ids},"max","pts"),
        ("Worst point differential",{r:points_for[r]-points_against[r] for r in ids},"min","pts"),
        ("Highest points per game",{r:points_for[r]/last for r in ids},"max","pts/game"),
        ("Most all-play wins",allplay,"max","wins")
    ]:
        add("Season to date","Cumulative",label,[(r,values[r],"") for r in ids],mode,unit,allweeks)
    for label,mode in [("Highest score","max"),("Lowest score","min")]:
        add("Single week","Game performance",label,
            [(r,value,f"W{i+1}") for r in ids for i,value in enumerate(scores[r])],mode,"pts",allweeks)
    for label,mode,condition in [
        ("Highest score in a loss","max",lambda a,b:a<b),
        ("Lowest score in a win","min",lambda a,b:a>b)]:
        entries=[]
        for w,groups in weekly:
            for pair in groups.values():
                for r in pair:
                    other=next(x for x in pair if x!=r)
                    a,b=scores[r][w-1],scores[other][w-1]
                    if condition(a,b):entries.append((r,a,f"W{w}"))
        add("Single week","Game performance",label,entries,mode,"pts",allweeks)
    for label,mode,metric in [
        ("Largest margin of victory","max","margin"),
        ("Closest victory","min","margin"),
        ("Highest combined matchup points","max","total"),
        ("Lowest combined matchup points","min","total")]:
        entries=[]
        for w,groups in weekly:
            for pair in groups.values():
                a,b=pair;pa,pb=scores[a][w-1],scores[b][w-1]
                if metric=="margin" and pa==pb:continue
                rid=a if pa>=pb else b
                entries.append((rid,abs(pa-pb) if metric=="margin" else pa+pb,f"W{w}"))
        add("Single week","Game performance",label,entries,mode,"pts",allweeks)
    result={"source":"Sleeper public API — finalized matchup results","season":int(league["season"]),
            "verifiedThroughWeek":last,"generated_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
            "rows":rows}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"Rebuilt {len(rows)-3} records through Week {last}")

if __name__ == "__main__":
    main()
