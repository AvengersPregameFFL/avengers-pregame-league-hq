#!/usr/bin/env python3
"""Send one opt-in OneSignal alert per NFL kickoff window, targeting ten minutes before kickoff.
Requires GitHub Actions secret ONESIGNAL_REST_API_KEY.
"""
import datetime as dt
import json
import os
import sys
import urllib.request
import uuid
from zoneinfo import ZoneInfo

EASTERN = ZoneInfo("America/New_York")
APP_ID = "0f86d84f-b2a8-401a-8c7e-f1dacf8d7094"
SITE = "https://avengerspregameffl.github.io/avengers-pregame-league-hq/"
KEY = os.environ.get("ONESIGNAL_REST_API_KEY", "")
now = dt.datetime.now(dt.timezone.utc)
local = now.astimezone(EASTERN)
DRY_RUN = "--dry-run" in sys.argv
if not KEY and not DRY_RUN:
    print("ERROR: ONESIGNAL_REST_API_KEY is missing; scheduled alerts cannot be delivered.")
    sys.exit(1)
if "--test" in sys.argv:
    subscription = os.environ.get("TEST_SUBSCRIPTION", "").strip()
    try:
        uuid.UUID(subscription)
    except ValueError:
        sys.exit("Invalid subscription ID; no test sent.")
    payload = {
        "app_id": APP_ID, "target_channel": "push",
        "include_subscription_ids": [subscription],
        "headings": {"en": "Avengers Pregame: Remote Delivery Test"},
        "contents": {"en": "This notification was sent by the league server, not your device."},
        "url": SITE, "ttl": 300,
        "idempotency_key": str(uuid.uuid4())
    }
    request = urllib.request.Request(
        "https://api.onesignal.com/notifications",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Authorization": "Key " + KEY, "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        reply = json.load(response)
    if not reply.get("id") or reply.get("recipients") == 0:
        sys.exit("Remote test not accepted or no recipients.")
    print("Remote test accepted; notification ID:", reply["id"], "recipients:", reply.get("recipients", "unknown"))
    sys.exit(0)

day = local.date()
url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=" + day.strftime("%Y%m%d") + "&limit=100"
try:
    req = urllib.request.Request(url, headers={"User-Agent": "AvengersPregameLeagueHQ/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.load(resp)
except Exception as e:
    print("Could not retrieve NFL schedule:", e)
    sys.exit(1)
starts = set()
for event in data.get("events", []):
    stamp = event.get("date")
    try:
        kickoff = dt.datetime.fromisoformat(stamp.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        continue
    if kickoff.astimezone(EASTERN).date() == day:
        starts.add(kickoff)
if not starts:
    print("No NFL kickoff on", day)
kickoff_errors = False
for kickoff in sorted(starts):
    minutes = (kickoff - now).total_seconds() / 60
    if not (2 < minutes <= 720):
        continue
    label = kickoff.astimezone(EASTERN).strftime("%A %I:%M %p ET")
    delivery = max(now, kickoff - dt.timedelta(minutes=10))
    payload = {
        "app_id": APP_ID,
        "target_channel": "push",
        "filters": [
            {"field": "tag", "key": "alert_kickoff", "relation": "not_exists"},
            {"operator": "OR"},
            {"field": "tag", "key": "alert_kickoff", "relation": "=", "value": "on"}
        ],
        "headings": {"en": "Avengers Pregame: Lock Your Lineups"},
        "contents": {"en": f"{label} kickoff is approaching. Check your starters, injuries, Pick'em and Survivor. No excuses, dumbasses."},
        "url": SITE,
        "name": "NFL kickoff " + kickoff.isoformat(),
        "idempotency_key": str(uuid.uuid5(uuid.NAMESPACE_URL, APP_ID + "/kickoff/" + kickoff.isoformat())),
        **({"send_after": delivery.isoformat()} if delivery > now else {}),
        "ttl": max(1, int((kickoff - delivery).total_seconds()))
    }
    if DRY_RUN:
        print("DRY RUN:", json.dumps(payload))
        continue
    req = urllib.request.Request(
        "https://api.onesignal.com/notifications",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": "Key " + KEY, "Content-Type": "application/json", "User-Agent": "AvengersPregameLeagueHQ/1.0"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            result = json.load(resp)
        if not result.get("id"):
            print("WARNING: No notification ID for", label, result, file=sys.stderr)
            kickoff_errors = True
            continue
        print("OneSignal accepted", label, result.get("id"), "recipients:", result.get("recipients", "unknown"))
    except Exception as exc:
        print("ERROR: Kickoff send failed", label, str(exc), file=sys.stderr)
        kickoff_errors = True

# Completed-week results, independently of kickoff windows.
def fetch_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"AvengersPregameLeagueHQ/1.0"}), timeout=20) as response:
        return json.load(response)

def send_final_results():
    api = "https://api.sleeper.app/v1"
    league = "1395849826633019392"
    state = fetch_json(api + "/state/nfl")
    week = int(state["week"])
    season = str(state["season"])
    # Only prior NFL weeks; never infer a final from a live score.
    if week < 2 or week > 15 or state.get("season_type") != "regular":
        return
    week -= 1
    # Avoid sending historical results every day; allow Tuesday/Wednesday retries.
    if local.weekday() not in (1, 2):
        return
    rows = fetch_json(f"{api}/league/{league}/matchups/{week}")
    groups = {}
    for row in rows:
        if row.get("matchup_id") is not None:
            groups.setdefault(row["matchup_id"], []).append(row)
    if len(groups) != 4 or any(len(g) != 2 for g in groups.values()) or len({r["roster_id"] for g in groups.values() for r in g}) != 8:
        raise RuntimeError("Incomplete Sleeper matchup data")
    for group in groups.values():
        for a,b in (group, group[::-1]):
            if a.get("points") is None or b.get("points") is None:
                raise RuntimeError("Missing matchup score")
            x,y = float(a["points"]),float(b["points"])
            result = "WIN" if x>y else "LOSS" if x<y else "TIE"
            payload = {"app_id":APP_ID,"target_channel":"push","filters":[{"field":"tag","key":"fantasy_roster","relation":"=","value":str(a["roster_id"])},{"operator":"AND"},{"field":"tag","key":"alert_final","relation":"=","value":"on"}],"headings":{"en":f"Week {week}: {result}"},"contents":{"en":f"Final weekly matchup score: {x:.2f}–{y:.2f}. " + ("Enjoy the victory." if x>y else "Better luck next week, loser." if x<y else "A tie. Nobody gets bragging rights.")},"url":SITE,"idempotency_key":str(uuid.uuid5(uuid.NAMESPACE_URL,f"{APP_ID}/final/{season}/{week}/{a['roster_id']}")),"ttl":86400}
            if DRY_RUN:
                print("DRY RUN:",json.dumps(payload))
                continue
            request = urllib.request.Request("https://api.onesignal.com/notifications",data=json.dumps(payload).encode(),headers={"Authorization":"Key "+KEY,"Content-Type":"application/json"},method="POST")
            with urllib.request.urlopen(request,timeout=25) as response:
                reply=json.load(response)
            print("Final result",week,a["roster_id"],reply.get("id"),reply.get("recipients"))
send_final_results()
if kickoff_errors:
    sys.exit(1)
