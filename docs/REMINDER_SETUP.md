# League HQ reminder setup

Recurring reminders are sent by GitHub Actions using OneSignal's REST API. The browser app never stores the REST API key.

## Required one-time setup
1. Open the OneSignal dashboard for the League HQ app (app ID: `0f86d84f-b2a8-401a-8c7e-f1dacf8d7094`).
2. In OneSignal settings, locate the REST API key for this app. Do not paste the key into chat or any repository file.
3. In GitHub, open `JumboJuggernaut/avengers-pregame-league-hq` → Settings → Secrets and variables → Actions → New repository secret.
4. Add secret `ONESIGNAL_REST_API_KEY` with that private key. `ONESIGNAL_APP_ID` is optional because the sender already uses the app's public ID.
5. Open Actions → League HQ scheduled reminders → Run workflow to test. Manual runs outside the scheduled local hours safely skip sending. To test actual delivery, use the OneSignal dashboard's test notification to an opted-in device.
6. Confirm OneSignal web push subscriptions exist and notification permission has been granted by managers.

## Current schedule
- Thursday 4 PM America/New_York: lineups, injuries, Pick'em, Survivor.
- Sunday 10 AM America/New_York: final pregame check.
- GitHub Actions may delay cron runs; the sender only sends during the specified local hour.
- Identical reminder/date combinations use deterministic OneSignal idempotency keys to reduce duplicates.

## Data refresh
`live-sync.js` refreshes Sleeper and public Sheets data on load, at most every 2 minutes while visible, and upon focus, visibility, or network reconnection. The homepage shows a freshness indicator and warns on source errors.

## Limits
- A GitHub Pages website cannot send scheduled push by itself. The Actions workflow needs the OneSignal REST API secret and working opted-in subscriptions.
- The sender does not access private Google Sheets or financial records.
- Payment statuses and commissioner-selected awards remain manually verified.
- This is not an App Store security certification or a substitute for testing real devices.
