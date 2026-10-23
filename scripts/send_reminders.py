"""Send recurring league reminders via OneSignal, never from public client code."""
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
import uuid
from zoneinfo import ZoneInfo

APP_URL = "https://jumbojuggernaut.github.io/avengers-pregame-league-hq/"
EASTERN = ZoneInfo("America/New_York")
DEFAULT_APP_ID = "0f86d84f-b2a8-401a-8c7e-f1dacf8d7094"

def reminder(now):
    # Send in Eastern local time, DST-safe. Github scheduled jobs can be delayed.
    day, hour = now.weekday(), now.hour
    if day == 3 and hour == 16:
        return ("THURSDAY LINEUP CHECK",
                "Set your starters, Pick'em and Survivor picks. Check injuries before kickoff.")
    if day == 6 and hour == 10:
        return ("SUNDAY GAME DAY",
                "Check inactives and lineups. Lock in your Pick'em and Survivor picks before kickoff.")
    return None

def main():
    now = dt.datetime.now(EASTERN)
    item = reminder(now)
    if not item:
        print("No reminder due at", now.isoformat())
        return
    app_id = os.environ.get("ONESIGNAL_APP_ID") or DEFAULT_APP_ID
    api_key = os.environ.get("ONESIGNAL_REST_API_KEY")
    if not api_key:
        print("Not sent: configure ONESIGNAL_REST_API_KEY in GitHub Actions secrets.", file=sys.stderr)
        sys.exit(1)
    title, message = item
    key = str(uuid.uuid5(uuid.NAMESPACE_URL, "avengers-pregame/" + now.date().isoformat() + "/" + title))
    payload = {
        "app_id": app_id,
        "included_segments": ["Subscribed Users"],
        "headings": {"en": title},
        "contents": {"en": message},
        "url": APP_URL,
        "isAnyWeb": True,
        "idempotency_key": key
    }
    request = urllib.request.Request(
        "https://api.onesignal.com/notifications",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": "Key " + api_key},
        method="POST"
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.load(response)
            print("OneSignal accepted reminder:", title, "notification id:", result.get("id"), "recipients:", result.get("recipients"))
    except urllib.error.HTTPError as error:
        print("OneSignal rejected reminder:", error.code, error.read().decode("utf-8", "replace")[:600], file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
