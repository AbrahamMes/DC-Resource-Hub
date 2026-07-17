# Data Center Resource Hub

A multi-site operations dashboard for Autodesk Construction Cloud (ACC). The application combines ACC issues and assets with site-specific schedules, contacts, building plans, and commissioning records in one React interface.

The repository currently defines two sites: **TTX (Temple, TX)** and **TXE (El Paso, TX)**. Each site has isolated SQLite databases and static data, while Autodesk authentication and the application code are shared.

## Features

- Multi-site selector with site-specific data and configuration
- Autodesk Platform Services (APS) three-legged OAuth
- ACC issue sync, filtering, links, and automatic hourly refresh
- ACC asset sync with cursor-based pagination and Excel-list matching
- Schedules, contacts, buildings, room plans, and mapped asset markers
- Site-specific commissioning form and grouped activity log
- Server-verified website access PIN plus a separate administrative sync PIN
- SQLite-backed sessions and application data
- Backup and backup-verification scripts

## Architecture

| Component | Location | Technology |
| --- | --- | --- |
| Backend | `backend/` | Node.js 18+, Express, better-sqlite3 |
| Frontend | `Frontend/building-webapp/` | React 19, React Router, Vite |
| Site configuration | `backend/src/config/sites.js` | ACC projects, data paths, buildings, rooms, markers |
| Site data | `backend/data/{SITE_ID}/` | SQLite, Excel, JSON, schedules, and building images |

The frontend sends the selected site with API requests. Backend site middleware validates it and selects the correct configuration and database, preventing data from one site from being mixed with another.

## Prerequisites

- Node.js 18 or newer
- npm
- An APS application with access to the ACC/BIM 360 APIs
- Access to the ACC projects configured in `backend/src/config/sites.js`

## Local Setup

1. Install dependencies:

   ```powershell
   cd backend
   npm install

   cd ..\Frontend\building-webapp
   npm install
   ```

2. Copy `backend/.env.example` to `backend/.env` and configure at least:

   ```env
   APS_CLIENT_ID=your_client_id
   APS_CLIENT_SECRET=your_client_secret
   APS_CALLBACK_URL=http://localhost:3001/api/auth/callback

   SESSION_SECRET=use_a_long_random_value
   SITE_ACCESS_PIN=website_access_pin
   SYNC_PIN=administrative_sync_pin

   FRONTEND_URL=http://localhost:5173
   PORT=3001
   ```

   `SITE_ACCESS_PIN` unlocks the dashboard. `SYNC_PIN` separately authorizes administrative actions such as re-syncing assets. Do not use the same PIN for both purposes in production.

   `ACC_PROJECT_ID` and `ACC_ASSIGNED_TO_ID` remain in the example file for compatibility but site-specific ACC settings are read from `backend/src/config/sites.js`.

3. In the APS application settings, add the exact callback URL from `APS_CALLBACK_URL` and enable the required ACC API access.

4. Optionally validate backend configuration:

   ```powershell
   cd backend
   npm run setup-check
   ```

5. Start the backend and frontend in separate terminals:

   ```powershell
   cd backend
   npm run dev
   ```

   ```powershell
   cd Frontend\building-webapp
   npm run dev
   ```

6. Open <http://localhost:5173>. The backend health endpoint is <http://localhost:3001/health>.

## Configuration

### Environment variables

See `backend/.env.example` for the full list. Important optional settings include:

- `SESSION_TTL_HOURS` and `SESSION_CLEANUP_MINUTES`
- `ISSUE_REFRESH_INTERVAL_MINUTES` and `ISSUE_REFRESH_STARTUP_DELAY_SECONDS`
- `SITE_ACCESS_TTL_HOURS`, `SITE_ACCESS_MAX_ATTEMPTS`, and `SITE_ACCESS_LOCKOUT_MINUTES`
- `TRUST_PROXY`, `SESSION_COOKIE_SECURE`, and `SESSION_COOKIE_SAME_SITE`
- `WEB_CONCURRENCY` (must remain `1` because SQLite and the in-process scheduler require a single backend instance)

Never commit `backend/.env` or credentials.

### Site configuration

Sites are defined in `backend/src/config/sites.js`. A site configuration controls:

- Site ID and display names
- One or more ACC project IDs
- Issue assignment/category filters
- Paths to issue, asset, and commissioning databases
- Excel asset list, contacts, schedules, and building images
- Building/room hierarchy, Bluebeam links, and floor-plan marker positions

The TXE Excel path is currently an absolute local path and must be changed for another workstation or hosting environment.

For complete instructions, see [Adding a New Site](docs/ADD_NEW_SITE.md).

### Site data layout

```text
backend/data/
  TTX/
    contacts.json
    location_mapping.json
    schedules/
    buildings/
    issues.db             # generated, ignored by Git
    assets.db             # generated, ignored by Git
    commissioning.db      # generated, ignored by Git
  TXE/
    ...
```

Location mappings connect ACC location strings to configured buildings and rooms. Room marker coordinates in `sites.js` then place matching assets on floor plans. See [Location Mapping](docs/LOCATION_MAPPING.md).

## Application Areas

- **Home**: site overview and navigation
- **Schedules**: site schedule image and six-week PDF
- **Contacts**: searchable site contact list
- **Issues**: ACC authentication, issue sync, filters, and direct ACC links
- **Assets**: ACC asset sync, Excel matching, search, and filters
- **Commissioning Report**: daily entry form and grouped commissioning log
- **Buildings**: building/room navigation, floor plans, Bluebeam links, and asset markers

Asset synchronization uses the ACC Assets API v2 cursor (`cursorState`) and stores all fetched assets. Display results are matched against the site's Excel asset list. ACC's `clientAssetId` is used as the primary asset name when available.

## API Overview

All `/api` routes except `/api/access` require the website access PIN session.

- `/api/access` - website access status, unlock, and lock
- `/api/auth` - APS OAuth login, callback, status, and logout
- `/api/sites` - sites, buildings, rooms, and mapped room assets
- `/api/issues` - local issues, ACC sync, and sync status
- `/api/assets` - local assets and ACC synchronization
- `/api/commissioning` - commissioning entries and supporting data
- `/api/schedules` - site schedule metadata and uploads
- `/api/contacts` - site contacts
- `/api/static` - protected site-specific files
- `/health` - public service health check

## Quality Checks

```powershell
cd backend
npm test

cd ..\Frontend\building-webapp
npm run lint
npm run build
```

## Production and Operations

`render.yaml` defines a single-instance Render backend with a persistent disk mounted at `backend/data`. Configure all `sync: false` environment variables in Render and deploy the frontend separately with its API URL targeting the backend.

Set `VITE_API_BASE_URL` when building the frontend if the API is not available at the default `http(s)://<frontend-host>:3001/api` address (for example, `VITE_API_BASE_URL=https://api.example.com/api`).

Production must use HTTPS, secure cookies, a trusted proxy setting, strong secrets, and persistent storage. Operational guides:

- [SQLite Deployment](docs/SQLITE_DEPLOYMENT.md)
- [Secrets and Sessions](docs/SECRETS_AND_SESSIONS.md)
- [Production Cookies](docs/PRODUCTION_COOKIES.md)
- [Website Access PIN](docs/WEBSITE_ACCESS_PIN.md)
- [Sync PIN Security](docs/SYNC_PIN_SECURITY.md)
- [Automatic Issue Refresh](docs/HOURLY_ISSUE_REFRESH.md)
- [Backups](docs/BACKUPS.md)

Run backups from `backend/` with `npm run backup` and validate them with `npm run backup:verify`.

## Troubleshooting

- **Backend exits during startup:** confirm `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, and `SESSION_SECRET` are non-empty, non-placeholder values.
- **OAuth callback fails:** make sure `APS_CALLBACK_URL` exactly matches the callback registered in APS.
- **Frontend cannot reach the API:** verify `FRONTEND_URL`, the frontend API configuration, CORS origin, and that cookies are sent with credentials.
- **No issues or assets appear:** confirm the selected site's ACC project/filter configuration and the authenticated user's project permissions.
- **Assets sync but do not display:** verify the site's Excel file exists and its asset identifiers match ACC `clientAssetId` values.
- **Schedule, contacts, or plan is missing:** check the path in `sites.js` and the corresponding file under `backend/data/{SITE_ID}`.
- **Production sessions are unstable:** use persistent storage, keep `WEB_CONCURRENCY=1`, and review the proxy/cookie documentation above.

## Additional Project Notes

- [Changelog](CHANGELOG.md)
- [Agent TODO](AGENT_TODO.md)
- [Backend notes](backend/README.md)
