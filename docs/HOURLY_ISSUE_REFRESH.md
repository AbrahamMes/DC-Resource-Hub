# Automatic ACC issue refresh

The backend refreshes every configured site's ACC issues 30 seconds after startup and once every 60 minutes afterward. Because the deployment uses one backend instance, only one scheduler runs. A run is skipped if the previous run is still active.

The Autodesk access and refresh tokens remain in the server-side SQLite session store on the persistent data volume; they are never sent to the frontend. Before each scheduled or manual refresh, the backend renews an access token that is expired or within five minutes of expiry. Rotated refresh tokens are immediately saved back to the persistent session. Logging out destroys that saved session. If Autodesk rejects the refresh token, an interactive login is required.

Configure timing with:

- `ISSUE_REFRESH_INTERVAL_MINUTES` (default `60`)
- `ISSUE_REFRESH_STARTUP_DELAY_SECONDS` (default `30`)

Each site's issues database has an `issue_sync_status` record per ACC project. `GET /api/issues/sync-status?site=SITE&projectId=PROJECT` returns the last attempt, success, failure, error, trigger (`manual` or `hourly`), and issue count. The Issues page displays the last successful refresh and any current failure.

Refresh failures are also written to backend logs. If the status says that interactive login is required, log in with Autodesk from the Issues page; the next startup/hourly run will use the new renewable authorization. Manual **Re-query ACC API** requests use the same token-renewal and synchronization path.

