# Data Center Resource Hub

A container-ready, multi-site operations dashboard for Autodesk Construction Cloud. It combines ACC issues and assets with mounted site schedules, contacts, building plans, and commissioning records.

## Architecture

- React/Vite frontend served by Nginx
- Express backend using APS three-legged OAuth
- Mounted `sites.json` registry; no customer sites are compiled into the application
- SQLite databases and all uploaded/static site data under `DATA_DIR`
- Persistent SQLite session store and hourly issue-refresh scheduler
- Single backend replica by design

## Docker quick start

1. Copy `backend/.env.docker.example` to `backend/.env` and provide the required secrets.
2. Copy `backend/config/sites.example.json` to `backend/config/sites.json` and configure at least one site. Note: TXE implementation is actually `backend/config/sites.txe.json`
3. Run: (note, Windows line endings suck and can break the script. Run from Docker.)

   ```sh
   docker compose up --build -d
   docker compose ps
   ```

4. Open `http://localhost:8080`.

See [Docker deployment](docs/DOCKER.md) for setup, storage, OAuth, backup, restore, upgrade, and troubleshooting procedures. See [Autodesk discovery](docs/AUTODESK_DISCOVERY.md) for account/project discovery and site-configuration ID mapping.

## Local development - For dev work

Node.js 22 is recommended.

```sh
cd backend
npm ci
npm test
npm run dev
```

In a separate terminal:

```sh
cd Frontend/building-webapp
npm ci
npm run dev
```

The backend reads `backend/.env` and `backend/config/sites.json`. These deployment-specific files are intentionally ignored by Git and Docker build contexts.

## Important commands

```sh
cd backend
npm run site:validate -- --config config/sites.json
npm run backup
npm run backup:verify -- backups/TIMESTAMP
npm run acc:list-hubs
npm run acc:list-accounts
```

All ACC discovery commands support `--json`; command-specific arguments are documented in [Autodesk discovery](docs/AUTODESK_DISCOVERY.md).
