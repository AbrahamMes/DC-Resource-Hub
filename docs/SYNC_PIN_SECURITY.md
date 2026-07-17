# Sync PIN transport

The asset synchronization PIN is sent only in the JSON body of a credentialed `POST /api/assets/sync-authorize` request. It is never included in the progress-stream URL.

After validating the authenticated Autodesk session and PIN, the backend stores a site-specific authorization grant in the server-side session. The grant expires after 60 seconds and is consumed when `GET /api/assets/sync-progress` begins.

The resulting progress URL contains only the non-sensitive site identifier. Therefore, the PIN does not appear in browser history, access-log URLs, monitoring URLs, or referrer headers.

The older JSON synchronization endpoint also requires the PIN in its request body, preventing it from bypassing the protected progress workflow.
