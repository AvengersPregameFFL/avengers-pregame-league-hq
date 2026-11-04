#!/usr/bin/env python3
"""Read-only Google Bible export for public league website. Never modifies manual picks."""
import json,os
from pathlib import Path
from datetime import datetime,timezone
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

BIBLE="17nk-KD_Cd8ohmjXWH3Z_t_bKq5m8eVLyDxFm9R6Kosw"
creds=Credentials.from_service_account_info(json.loads(os.environ["GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON"]),scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"])
api=build("sheets","v4",credentials=creds,cache_discovery=False)
out={"generated_at_utc":datetime.now(timezone.utc).isoformat(),"source":"Avengers Pregame Bible","survivor":{},"pickem":{}}
v=api.spreadsheets().values().batchGet(spreadsheetId=BIBLE,ranges=["'Survivor'!A1:BA20","'Pickem'!A1:F250"]).execute()["valueRanges"]
sur=v[0].get("values",[])
for row in sur[1:]:
    row=row+[""]*max(0,50-len(row))
    if not row[0]:continue
    weeks=[]
    for week in range(1,19):
        pos=2 if week==1 else 4 if week==2 else 10+2*(week-3)
        pick=row[pos] if pos<len(row) else ""
        outcome=row[pos+1] if pos+1<len(row) else ""
        if pick or outcome:weeks.append({"week":week,"pick":pick,"outcome":outcome})
    out["survivor"][row[0]]={"status":row[7],"revives_used":row[6],"weeks":weeks}
for row in v[1].get("values",[])[1:]:
    if len(row)<4 or not row[0].isdigit() or not row[3].strip():continue
    manager=row[1];out["pickem"].setdefault(manager,[]).append({"week":int(row[0]),"correct":float(row[3]),"games":int(row[4]) if len(row)>4 and row[4].isdigit() else None})
if len(out["survivor"])!=8:raise SystemExit("Expected eight survivor managers")
if not out["pickem"]:raise SystemExit("No Pickem rows")
Path("data/league-contests.json").write_text(json.dumps(out,indent=2)+"\n")
print("Exported",len(out["survivor"]),"survivor managers and",sum(map(len,out["pickem"].values())),"Pickem entries")
