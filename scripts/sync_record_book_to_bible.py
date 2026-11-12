#!/usr/bin/env python3
"""Sync Sleeper-derived, FINALIZED cumulative league records into Avengers Pregame Bible.

Updates only Record Book!D22:J32. Never overwrites manual pick, survivor, award,
or other tab data. Fails closed on schema mismatch or week regression.
"""
import json
import os
import re
from pathlib import Path

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

SPREADSHEET_ID = "17nk-KD_Cd8ohmjXWH3Z_t_bKq5m8eVLyDxFm9R6Kosw"
LABELS = [
    "Most head-to-head wins",
    "Longest winning streak",
    "Longest losing streak",
    "Most fantasy points scored",
    "Fewest fantasy points scored",
    "Most points allowed",
    "Fewest points allowed",
    "Best point differential",
    "Worst point differential",
    "Highest points per game",
    "Most all-play wins",
]

def main():
    raw = os.environ.get("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON")
    if not raw:
        print("::warning::Google Sheets credential not configured; no sheet changes made.")
        return
    data = json.loads(Path("data/record-book.json").read_text(encoding="utf-8"))
    latest = int(data.get("verifiedThroughWeek") or 0)
    if latest < 1 or latest > 18:
        raise RuntimeError("Refusing to publish record book with invalid week.")
    records = {r[2]: r for r in data["rows"] if len(r) >= 9 and r[0] == "Season to date"}
    if not all(label in records for label in LABELS):
        raise RuntimeError("Record source is incomplete; no sheet changes made.")
    credential = Credentials.from_service_account_info(
        json.loads(raw), scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    sheets = build("sheets", "v4", credentials=credential, cache_discovery=False).spreadsheets()
    current = sheets.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range="'Record Book'!C22:J32",
        valueRenderOption="UNFORMATTED_VALUE",
    ).execute().get("values", [])
    if len(current) != len(LABELS):
        raise RuntimeError("Bible's Record Book rows moved; refusing write.")
    for i, label in enumerate(LABELS):
        if not current[i] or current[i][0] != label:
            raise RuntimeError(f"Bible Record Book row {22+i} not {label!r}; refusing write.")
    existing = str(current[0][5]) if len(current[0]) >= 6 else ""
    match = re.search(r"Weeks? 1[–-](\d+)", existing)
    if match and int(match.group(1)) > latest:
        raise RuntimeError("Google Bible is newer than Sleeper snapshot; refusing regression.")
    row_values = []
    for i,label in enumerate(LABELS):
        row = records[label]
        name = str(row[3]).replace("DK", "Dakota")
        detail = ("Nick won Weeks 1–6 consecutively" if label == "Longest winning streak"
                  else "Finalized Sleeper matchups")
        row_values.append([name, row[4], row[5], row[6], row[7],
                           detail, f"Cumulative verified through Week {latest} · Sleeper final matchups"])
    desired = [[str(c) for c in row] for row in row_values]
    present = [[str(c) for c in row[1:8]] for row in current]
    if desired == present:
        print(f"Bible Record Book already current through Week {latest}")
        return
    sheets.values().update(
        spreadsheetId=SPREADSHEET_ID,
        range="'Record Book'!D22:J32",
        valueInputOption="USER_ENTERED",
        body={"range":"'Record Book'!D22:J32",
              "majorDimension":"ROWS","values":row_values}
    ).execute()
    print(f"Google Bible cumulative records refreshed through Week {latest}")

if __name__ == "__main__":
    main()
