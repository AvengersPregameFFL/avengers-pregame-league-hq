# Avengers Pregame AI Command Center — supervised autonomy

## Operating contract
J.A.R.V.I.S. coordinates six roles: Vision (Sleeper), Oracle (records), Jameson (editorial), Iron Man (site), Doctor Strange (analysis), and Nick Fury (verification). These are **roles and workflows**, not independently running AI agents until a runtime and credentials are provisioned.

## Permissions
- Automatic: read public Sleeper data, validate snapshots, calculate deterministic stats, report health, open draft pull requests.
- Commissioner approval required: publishing editorial content, merging website code, changing league rules or awards, changing historical results, writing to Google Sheets, and sending non-routine league-wide messages.
- Never automatically merge PRs or push AI-generated code directly to main.
- No secret values, member contact data, or unpublished personal information in public logs, issues, or repository files.

## Sources of truth
- Sleeper: league settings, roster/matchup snapshots, scoring.
- Google Sheets: historical commissioner-approved records **once a verified sheet and write authorization are configured**.
- Repository: website code and editorial assets.
- Derived statistics must identify source timestamp and computation method.
- Do not silently replace confirmed historical results with live roster ownership.

## Reliability
- Run read-only checks before making changes.
- If inputs are stale, missing, inconsistent, or unverifiable: stop and flag; never invent scores.
- Preserve the current production site; propose changes via a separate branch and draft PR.
- Protect main with required review/checks in GitHub settings when available.
- AI text must be fact-checked against source data and reviewed by commissioner.
- Avoid deployment storms: consider filtering deploy triggers to website-relevant paths after verifying dependencies.

## Deployment stages
1. Read-only audit and validation (this PR).
2. Test Sleeper ingestion and Google Sheets mapping with commissioner authorization.
3. Add review-gated editorial and developer jobs.
4. Add status dashboard, failure alerts, and rollback playbook.

## Known audit observations (2026-11-03)
- Existing hourly Sleeper roster sync and daily optimal-lineup refresh commit to main.
- Pages deploy runs on every main push.
- Deployment workflow contains strict homepage assertions; several recent failures preceded a successful deployment.
- README says live Google Sheets sync is not configured; verify against connected sheet before enabling writes.
- OneSignal notification jobs exist; their secret configuration and end-to-end delivery are not verified.
