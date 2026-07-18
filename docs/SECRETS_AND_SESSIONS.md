# Secrets and persistent sessions

Production secrets must be supplied by the hosting platform's encrypted environment-variable settings. Required values are `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `SESSION_SECRET`, and `SYNC_PIN`. The backend refuses to start when any is absent or still uses a documented placeholder. Never place real values in source files, frontend variables, build arguments, logs, or documentation.

Keep `SESSION_SECRET` stable across deployments. Rotating it invalidates every existing signed session cookie and requires users to authenticate again. Use a cryptographically random value and rotate it deliberately if compromise is suspected.

Sessions are stored in `sessions.db` beneath `DATA_DIR`, which is on the same persistent volume as the site databases in the Compose deployment. The default session lifetime is 24 hours and expired rows are removed every 15 minutes. Configure these using `SESSION_TTL_HOURS` and `SESSION_CLEANUP_MINUTES`. The session database contains Autodesk access and refresh tokens, so restrict volume and backup access accordingly.

The Render Blueprint declares secret variables with `sync: false` (or generates the session secret) so their values are entered or generated in Render rather than committed to Git. For another host, create equivalent encrypted environment variables in its dashboard or secret manager.
