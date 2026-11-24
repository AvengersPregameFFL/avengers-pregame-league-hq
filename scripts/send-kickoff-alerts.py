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
if not KEY:
    print("ERROR: ONESIGNAL_REST_API_KEY is missing; scheduled alerts cannot be delivered.")
    sys.exit(1)
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
    sys.exit(0)
for kickoff in sorted(starts):
    minutes = (kickoff - now).total_seconds() / 60
    if not (0 < minutes <= 10):
        continue
    label = kickoff.astimezone(EASTERN).strftime("%A %I:%M %p ET")
    payload = {
        "app_id": APP_ID,
        "included_segments": ["Subscribed Users"],
        "headings": {"en": "Avengers Pregame: Lock Your Lineups"},
        "contents": {"en": f"{label} kickoff is approaching. Check your starters, injuries, Pick'em and Survivor. No excuses, dumbasses."},
        "url": SITE,
        "name": "NFL kickoff " + kickoff.isoformat(),
        "idempotency_key": str(uuid.uuid5(uuid.NAMESPACE_URL, APP_ID + "/kickoff/" + kickoff.isoformat())),
        "ttl": max(1, int(minutes * 60))
    }
    req = urllib.request.Request(
        "https://api.onesignal.com/notifications",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": "Key " + KEY, "Content-Type": "application/json", "User-Agent": "AvengersPregameLeagueHQ/1.0"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.load(resp)
    if not result.get("id"):
        raise RuntimeError("OneSignal did not return a notification ID: " + str(result))
    print("OneSignal accepted", label, result.get("id"), "recipients:", result.get("recipients", "unknown"))
