# Avengers Pregame League HQ

Installable comic-book fantasy football league web app.

## Deployment

This repository is configured for **GitHub Pages** using the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`.

1. Add the existing PWA package files to the repository root: `index.html`, `manifest.webmanifest`, `service-worker.js`, and `icons/`.
2. In **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
3. Push changes to `main`. The workflow publishes automatically.
4. Open the GitHub Pages URL in Chrome or Safari and install to the home screen.

The PWA's service worker may cache app assets. For reliable updates, update the service worker cache version whenever the published app changes.

## Data and privacy

This repository is currently **public**. Do not commit access tokens, credentials, private league information, or unpublished personal information. Existing league data embedded in HTML will be publicly viewable once published.

## Current status

Deployment automation configured; the original app files must be uploaded before the website can go live. Live Google Sheets synchronization is not configured.
