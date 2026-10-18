#!/usr/bin/env python3
"""Send one opt-in OneSignal alert an hour before the first NFL kickoff of Thu/Sun/Mon.
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
SITE = "https://jumbojuggernaut.github.io/avengers-pregame-league-hq/"
KEY = os.environ.get("ONESIGNAL_REST_API_KEY", "")
now = dt.datetime.now(dt.timezone.utc)
local = now.astimezone(EASTERN)
if local.weekday() not in (0, 3, 6):
    print("Not Monday, Thursday, or Sunday in Eastern time.")
    sys.exit(0)
if not KEY:
    print("ONESIGNAL_REST_API_KEY is missing; no notification sent.")
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
starts = []
for event in data.get("events", []):
    stamp = event.get("date")
    try:
        kickoff = dt.datetime.fromisoformat(stamp.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        continue
    if kickoff.astimezone(EASTERN).date() == day:
        starts.append(kickoff)
if not starts:
    print("No NFL kickoff on", day)
    sys.exit(0)
first = min(starts)
minutes = (first - now).total_seconds() / 60
print("First kickoff:", first.isoformat(), "minutes away:", round(minutes, 1))
# A 15-minute window accommodates a five-minute cron cadence and typical GitHub Actions delays.
if not (45 <= minutes <= 65):
    print("Outside one-hour notification window.")
    sys.exit(0)
label = {0:"Monday", 3:"Thursday", 6:"Sunday"}[local.weekday()]
payload = {
    "app_id": APP_ID,
    "included_segments": ["Subscribed Users"],
    "headings": {"en": "Avengers Pregame: " + label + " Kickoff"},
    "contents": {"en": "Kickoff is in an hour, dumbasses. Check your lineups, injuries, Pick'em and Survivor. Your commissioner can't do everything!"},
    "url": SITE,
    "name": label + " NFL kickoff reminder " + str(day),
    "idempotency_key": str(uuid.uuid5(uuid.NAMESPACE_URL, APP_ID + "/" + str(day) + "/first-kickoff"))
}
req = urllib.request.Request(
    "https://api.onesignal.com/notifications",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Authorization": "Key " + KEY, "Content-Type": "application/json", "User-Agent": "AvengersPregameLeagueHQ/1.0"},
    method="POST"
)
try:
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.load(resp)
    print("OneSignal accepted notification:", result.get("id", "no id"), "recipients:", result.get("recipients", "unknown"))
except Exception as e:
    print("OneSignal request failed:", e)
    sys.exit(1)
