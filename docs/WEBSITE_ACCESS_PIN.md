# Website access PIN

The application has a front-door website PIN that is separate from the administrative `SYNC_PIN`. Until a browser unlocks its server-side session, the frontend renders only the PIN screen and the backend rejects all dashboard APIs and project files.

Configure these backend environment variables:

```env
SITE_ACCESS_PIN=choose-a-long-private-pin-or-passphrase
SITE_ACCESS_TTL_HOURS=24
SITE_ACCESS_MAX_ATTEMPTS=5
SITE_ACCESS_LOCKOUT_MINUTES=15
```

Do not use a `VITE_` variable for this PIN. `SITE_ACCESS_PIN` must exist only in the backend environment. Use a different value for `SYNC_PIN`, which continues to protect administrative actions.

After five incorrect attempts from one address, further attempts are blocked until the 15-minute window ends. Successful access is stored in the existing persistent server-side session and defaults to 24 hours. The **Lock** navigation action immediately removes website access from that browser session.

The following endpoints remain public so the gate and hosting platform can operate:

- `GET /health`
- `GET /api/access/status`
- `POST /api/access/unlock`

All other `/api` routes, including Autodesk authentication and project files, require website access first. Production must use HTTPS.

