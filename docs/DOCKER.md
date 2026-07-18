# Docker deployment

## Deployment model

The supported deployment is one Nginx frontend/reverse-proxy container and exactly one backend container. The backend uses SQLite, local uploads, a SQLite session store, and an in-process issue scheduler. Never scale the backend above one replica. `WEB_CONCURRENCY=1` is enforced at startup.

Horizontal scaling requires PostgreSQL for relational data and sessions, shared object storage for uploads and site files, a separate scheduled-sync worker, and distributed per-project locking. Backend replicas must be stateless before their count is increased.

## Prerequisites

- Docker Engine 24 or newer
- Docker Compose v2
- An Autodesk APS application provisioned for the target ACC account

No host Node.js installation is required.

## Initial setup

1. Copy `backend/.env.docker.example` to `backend/.env` and fill every secret. Controlled local/LAN HTTP deployments require `ALLOW_INSECURE_HTTP=true`. Leave it false or remove it when TLS is available.
2. Copy `backend/config/sites.example.json` to `backend/config/sites.json` and replace all example metadata with discovered values. Keep database and file paths relative to `DATA_DIR`.
3. Validate configuration:

   ```sh
   docker compose run --rm backend npm run site:validate -- --config /app/config/sites.json
   ```

4. Start the deployment:

   ```sh
   docker compose up --build -d
   docker compose ps
   docker compose logs -f backend frontend
   ```

5. Open `http://localhost:8080`. Stop with `docker compose down`. Do not add `--volumes` unless permanent data deletion is intended.

The entrypoint creates missing site databases and parent directories without overwriting existing files. Add contacts as a JSON array at the configured contacts path, mappings as `{SITE_ID}/location_mapping.json`, building images beneath the configured `buildingsDir`, imports beneath the configured import path, and schedules through the application.

## Storage and configuration

| Container path | Compose source | Behavior |
| --- | --- | --- |
| `/app/data` | `app-data` named volume | Databases, sessions, schedules, contacts, mappings, images, imports, uploads |
| `/app/backups` | `app-backups` named volume | Backup snapshots and manifests |
| `/app/config/sites.json` | `backend/config/sites.json` | Read-only deployment configuration |

Add or remove a site by editing the mounted `sites.json`, creating its data files, validating it, and restarting the backend. Rebuilding images is unnecessary.

## OAuth, proxy, and secrets

The public topology is same-origin: Nginx serves React and proxies `/api` and `/health`. For an internet-connected deployment, set both `FRONTEND_URL` and the origin of `APS_CALLBACK_URL` to the final HTTPS origin, use `APS_CALLBACK_URL=https://HOST/api/auth/callback`, register that exact callback in APS, and leave `ALLOW_INSECURE_HTTP=false`. Secure mode rejects HTTP and localhost. `TRUST_PROXY=1`, secure cookies, and `SameSite=lax` are the normal same-origin settings.

For an isolated controlled network without TLS, set `ALLOW_INSECURE_HTTP=true`, `SESSION_COOKIE_SECURE=false`, and use the same HTTP origin for `FRONTEND_URL` and `APS_CALLBACK_URL` (for example `http://192.168.10.25:8080`). Register that exact HTTP callback with Autodesk if OAuth will be used. This option deliberately relaxes transport security and should not be exposed to the internet.

Supply credentials only at runtime. Do not place secrets in Compose, Dockerfiles, build arguments, frontend variables, `sites.json`, or logs. `backend/.env` is suitable only for local testing. Production deployments should inject environment variables from Docker secrets or the hosting provider's secret manager.

Test login, callback, page refresh/session restoration, and logout through the public URL after every proxy or cookie change.

## Backups and restore

Run a backup:

```sh
docker compose exec backend npm run backup
docker compose exec backend npm run backup:verify -- /app/backups/TIMESTAMP
```

Backups use SQLite's backup API for live databases, copy every other file under `DATA_DIR`, include `sites.json`, create SHA-256 manifests, prune snapshots older than `BACKUP_RETENTION_DAYS`, and refuse to start below `BACKUP_MIN_FREE_MB`. Monitor the backup volume with the deployment platform and alert before it reaches that threshold.

Restore into a fresh deployment while the backend is stopped:

1. Verify the snapshot.
2. Stop the deployment with `docker compose down` without `--volumes`.
3. Preserve the current data volume as a rollback copy.
4. Restore the snapshot's `data/` contents into `/app/data` and its `config/sites.json` to the host configuration path.
5. Start the deployment and verify every site's issues, assets, commissioning entries, contacts, schedules, mappings, drawings, and imports.

## Upgrade and rollback

Create and verify a backup before upgrading. Pull or build the new image, run `docker compose up -d --build`, inspect health and logs, and exercise authentication plus each site. Container replacement preserves named volumes. To roll back application code, redeploy the previous image tag. If a schema change is incompatible, stop the backend and restore the pre-upgrade snapshot before deploying the previous image.

## Troubleshooting

- `Site configuration not found`: create `backend/config/sites.json`; Compose mounts it read-only.
- `Site validation failed`: run `site:validate` and correct the named field or path.
- Backend unhealthy: inspect `docker compose logs backend`; required secrets or URLs may be invalid.
- OAuth redirect failure: the configured and APS-registered callback URLs must match exactly.
- Permission errors under `/app/data`: ensure the mounted volume is writable by container user `node`.
- Discovery `403`: verify OAuth scopes, ACC app provisioning, and the authenticated user's account/project permissions.
