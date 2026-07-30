# TXE Docker deployment

The `TXEContainer` branch is the El Paso deployment profile built on the generic `Containerization` implementation. It exposes only the `TXE` site, selects TXE by default, and mounts the host's `backend/data/TXE` directory at `/app/data/TXE` so existing TXE databases and uploaded resources survive container replacement.

## Configure and start

1. Copy `backend/.env.docker.example` to `backend/.env` and provide the APS and application secrets. Do not commit that file.
2. Confirm that the IDs and resource links in `backend/config/sites.txe.json` are current.
3. Place TXE runtime files under `backend/data/TXE` using the paths declared in `sites.txe.json`.
4. Validate and start the deployment:

   ```sh
   docker compose run --rm backend npm run site:validate -- --config /app/config/sites.json
   docker compose up --build -d
   docker compose ps
   ```

The Compose project retains sessions and other shared state in `app-data`, backups in `app-backups`, and TXE site state in the host directory. Never run `docker compose down --volumes` unless deleting named-volume state is intentional.

## Required TXE runtime paths

- `backend/data/TXE/issues.db`
- `backend/data/TXE/assets.db`
- `backend/data/TXE/commissioning.db`
- `backend/data/TXE/contacts.json`
- `backend/data/TXE/imports/TXE_Asset List_Rev10_TXE.xlsx`
- `backend/data/TXE/schedules/`
- `backend/data/TXE/buildings/`

The entrypoint creates missing databases and parent directories without overwriting existing files. Database files, credentials, uploads, and customer documents remain excluded from Git.

For HTTPS, cookie, backup, restore, and troubleshooting details, see `docs/DOCKER.md`.
