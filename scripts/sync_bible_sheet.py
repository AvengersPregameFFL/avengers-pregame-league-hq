#!/usr/bin/env python3
"""Safely synchronize verified Sleeper optimal lineup data to ONE authorized Sheet.

Requires a Google service-account JSON in GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON.
The service account must be explicitly shared on the target spreadsheet.
Dry-run is the default; --apply is required to write.
"""
import argparse
import json
import os
from pathlib import Path

BIBLE_ID = "17nk-KD_Cd8ohmjXWH3Z_t_bKq5m8eVLyDxFm9R6Kosw"
LEAGUE_ID = "1395849826633019392"
FEED_TAB = "Sleeper Optimal Feed"
HEADER = ["Week", "Roster ID", "Manager", "Actual", "Optimal", "Efficiency"]

def prepare_rows(source):
    if str(source.get("league_id")) != LEAGUE_ID:
        raise ValueError("Wrong Sleeper league ID")
    raw = source.get("rows", [])
    if not raw:
        raise ValueError("Empty optimal lineup feed")
    seen = set()
    rows = []
    for item in raw:
        week, roster = int(item["week"]), int(item["roster_id"])
        if not (1 <= week <= 18 and 1 <= roster <= 8):
            raise ValueError("Invalid week or roster")
        if (week, roster) in seen:
            raise ValueError("Duplicate week/roster")
        seen.add((week, roster))
        actual, optimal = float(item["actual"]), float(item["optimal"])
        if actual < 0 or optimal + 0.02 < actual:
            raise ValueError("Invalid actual/optimal points")
        rows.append([week, roster, str(item["manager"]), actual, optimal, round(actual / optimal * 100, 2) if optimal else 0])
    rows.sort(key=lambda row: (row[0], row[1]))
    if len(rows) > 144:
        raise ValueError("Too many rows")
    return rows

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="data/optimal-lineups.json")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    data = json.loads(Path(args.source).read_text())
    rows = prepare_rows(data)
    print(f"Validated {len(rows)} records for {FEED_TAB}; latest week {max(row[0] for row in rows)}")
    if not args.apply:
        print("DRY RUN: no Google Sheet modified")
        return
    secret = os.environ.get("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON")
    if not secret:
        raise SystemExit("Missing GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON; no write attempted")
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    creds = Credentials.from_service_account_info(json.loads(secret), scopes=[
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ])
    sheets = build("sheets", "v4", credentials=creds, cache_discovery=False)
    drive = build("drive", "v3", credentials=creds, cache_discovery=False)
    metadata = sheets.spreadsheets().get(spreadsheetId=BIBLE_ID, fields="spreadsheetId,properties(title),sheets(properties(title,gridProperties))").execute()
    if metadata["properties"]["title"] != "Avengers Pregame Bible":
        raise SystemExit("Spreadsheet title mismatch; refusing to write")
    tab = next((s for s in metadata["sheets"] if s["properties"]["title"] == FEED_TAB), None)
    if not tab or tab["properties"]["gridProperties"]["rowCount"] < len(rows) + 1:
        raise SystemExit("Missing or undersized feed tab")
    old = sheets.spreadsheets().values().get(spreadsheetId=BIBLE_ID, range="'Sleeper Optimal Feed'!A1:F400").execute().get("values", [])
    if old and old[0] != HEADER:
        raise SystemExit("Feed header mismatch; refusing to overwrite")
    # Full copy of every tab, formulas, formatting and charts before any write.
    backup = drive.files().copy(fileId=BIBLE_ID, body={"name": "AUTO BACKUP — Avengers Pregame Bible — " + data["generated_at"]}, fields="id,name").execute()
    print("Created recovery backup:", backup["id"])
    # Write ONLY columns A:F of the designated feed tab. Never touch manual
    # Pick'em, Survivor, awards, dues, or other historical tables.
    payload = {"valueInputOption": "RAW", "data": [
        {"range": "'Sleeper Optimal Feed'!A1:F" + str(len(rows) + 1), "values": [HEADER] + rows},
    ]}
    sheets.spreadsheets().values().batchUpdate(spreadsheetId=BIBLE_ID, body=payload).execute()
    # Clear stale trailing rows without changing formulas outside the feed.
    if len(old) > len(rows) + 1:
        sheets.spreadsheets().values().clear(spreadsheetId=BIBLE_ID,
            range=f"'Sleeper Optimal Feed'!A{len(rows)+2}:F{len(old)}", body={}).execute()
    check = sheets.spreadsheets().values().get(spreadsheetId=BIBLE_ID,
        range=f"'Sleeper Optimal Feed'!A1:F{len(rows)+1}").execute().get("values", [])
    if len(check) != len(rows) + 1:
        raise SystemExit("Post-write row count mismatch; restore from backup " + backup["id"])
    print("Verified Bible feed update; backup ID:", backup["id"])

if __name__ == "__main__":
    main()
