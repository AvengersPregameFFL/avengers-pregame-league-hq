# Emergency rollback — Avengers Pregame League HQ

## Baseline checkpoint
- Captured: 2026-11-03 (Eastern)
- Backup branch: `backup/pre-ai-command-center-2026-11-03`
- Immutable reference commit SHA: `2e31d8250b65d258340f3d23f59149abbe7ccd4d`
- This checkpoint covers Git-tracked website source and committed data only. It does NOT back up GitHub secrets, GitHub settings, Google Sheets revision history, Sleeper data, push notification subscribers, or external hosting settings.

## Emergency protocol
1. Stop/disable newly introduced AI workflows first (GitHub Actions > select workflow > Disable workflow), to avoid immediate re-modification.
2. Identify whether the problem is code, data, secrets, deployment, or an external integration. Save the failing run URL/logs without copying credentials.
3. Prefer a **revert pull request** that reverses the offending commits on `main`; this preserves newer legitimate roster/score data.
4. If full website restoration is necessary, create a restoration branch from the exact baseline SHA and open a PR targeting `main`. Review changes carefully: a wholesale rollback also reverts legitimate data and articles committed since the checkpoint.
5. Merge only after commissioner approval; confirm GitHub Pages deployment success, homepage functionality, Sleeper sync, optimal lineup checks, and notification behavior.
6. Restore external services separately using their own version history/backups. Do not claim Git rollback restores Google Sheets or OneSignal settings.

## Safety requirements
- Never force-push `main` automatically.
- Never delete the backup branch. Protect it against deletion/force pushes in GitHub settings if supported.
- Never automatically roll back in response to a single failed check; alert and require commissioner approval.
- Create an additional baseline archive outside the repository for protection against repository deletion or compromised access.
