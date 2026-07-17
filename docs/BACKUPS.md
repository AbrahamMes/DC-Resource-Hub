# Backups and restore testing

The backend backup command creates a complete timestamped snapshot of `backend/data`. SQLite files use SQLite's online backup API, so the application can remain running while the snapshot is created. Uploaded schedules, contacts, drawings/building images, spreadsheets, mapping files, and schedule configuration are copied with their relative paths. `src/config/sites.js` is also included because it defines the data layout. Secrets and `.env` files are intentionally excluded.

## Create and verify a backup

Run from `backend`:

```powershell
npm run backup
npm run backup:verify -- backups/2026-07-14T12-00-00-000Z
```

Each completed snapshot has a `manifest.json` containing sizes and SHA-256 checksums. A snapshot is first built in a `.partial` directory and becomes visible only after all database integrity checks succeed. Verification copies the data to a temporary restore directory, checks every checksum, opens every restored database, runs `PRAGMA integrity_check`, and then removes the test directory.

Configuration:

- `BACKUP_DIR`: destination directory; defaults to `backend/backups`. In production, set this to durable storage separate from the application's data disk.
- `BACKUP_RETENTION_DAYS`: completed snapshots older than this are removed after a successful backup; defaults to `30`.
- `BACKUP_SOURCE_DIR`: data directory override, primarily useful for testing.

Do not treat backups on the same local disk as disaster recovery. Replicate the backup destination to encrypted off-host storage and restrict access to operations staff.

## Automation

Schedule `npm run backup` daily with the hosting provider's cron/scheduled-job feature. Schedule `npm run backup:verify -- <latest snapshot>` at least monthly and after storage or schema changes. Configure monitoring to alert on any nonzero exit code. The scheduler must supply the same `BACKUP_DIR` and retention setting on every run.

## Production restore

1. Stop the backend so no process can write to `backend/data`.
2. Run `npm run backup:verify -- <snapshot>` and require a successful result.
3. Move the current data directory aside; do not delete it until the restored application is accepted.
4. Copy the snapshot's `data` directory into the backend as `data`, preserving its directory structure. Review the backed-up `config/sites.js` against the deployed `src/config/sites.js` and restore it only if the site layout must also be rolled back.
5. Start one backend instance, check logs, authenticate, and smoke-test each site's issues, assets, commissioning reports, schedules, contacts, and drawings.
6. Record the restore date, snapshot name, operator, and test results. Perform this drill at least quarterly.

Never restore over live SQLite files or copy live `.db` files with ordinary filesystem tools.
