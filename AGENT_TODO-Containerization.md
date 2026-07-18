# Containerization TODO

This checklist covers the work required to make the application portable and deployable with Docker. Adding Dockerfiles alone is not sufficient: site configuration, persistent data, frontend project metadata, and Autodesk discovery workflows must first be separated from the TTX/TXE-specific source code.

## Priority 1: Remove deployment blockers

- [x] **Move site definitions out of source code**
  - Replace the hard-coded `TTX` and `TXE` definitions in `backend/src/config/sites.js` with a mounted configuration file or database-backed site registry.
  - Add an environment variable such as `SITES_CONFIG_PATH=/app/config/sites.json`.
  - Move the following values into external site configuration:
    - Site IDs, names, and descriptions
    - ACC project IDs and display names
    - Prime Controls company and member IDs
    - ACC asset category IDs and names
    - Database filenames
    - Contact, schedule, drawing, and Excel paths
    - Building and room definitions
    - Bluebeam URLs
  - Add a sanitized `sites.example.json` that contains no customer-specific IDs or paths.

- [x] **Remove the Windows-only TXE Excel path**
  - Remove the absolute `C:\Users\Prime\OneDrive...` path from `backend/src/config/sites.js`.
  - Store imported spreadsheets under the persistent data volume, mount a separate imports directory, or support uploading spreadsheets through the application.
  - Save only container-relative or data-root-relative paths in site configuration.

- [x] **Make the backend the only source of ACC project configuration**
  - Remove the duplicated `ACC_PROJECTS` object from `Frontend/building-webapp/src/components/AccProjectSelector.jsx`.
  - Return allowed ACC projects and their display names from `/api/sites` or `/api/sites/:siteId`.
  - Populate the frontend project selector from the backend response.
  - Validate every client-supplied `projectId` against the configured projects for the selected site.

- [x] **Remove implicit TTX and TXE defaults**
  - Remove the silent `TTX` fallback from `backend/src/middleware/siteContext.js`.
  - Remove the `TXE` default and error fallback from `Frontend/building-webapp/src/contexts/SiteContext.jsx`.
  - Add `DEFAULT_SITE_ID`, or deliberately use the first configured site.
  - Require an explicit site on operations where ambiguity could read or modify the wrong data.
  - Display a service/configuration error if the sites API fails instead of fabricating a TXE site.

- [x] **Remove remaining site-specific frontend presentation**
  - Replace or generalize `Frontend/building-webapp/src/pages/TTX1.jsx`.
  - Replace the hard-coded `Frontend/building-webapp/src/data/buildingsConfig.json` data.
  - Remove hard-coded TXE building IDs from `Buildings.jsx`.
  - Remove TTX-specific image paths under `/src/assets`.
  - Remove `TXE` display fallbacks from `Home.jsx` and other pages.
  - Stop bundling site-specific contacts, schedules, floor plans, and customer resources into the frontend image.
  - Load buildings, rooms, images, contacts, schedules, and project choices from backend site metadata and static-data routes.

## Priority 2: Add Autodesk ACC discovery and setup tooling

- [x] **Create authenticated discovery commands**
  - Add `npm run acc:list-hubs`.
  - Add `npm run acc:list-projects -- --hub <id>`.
  - Add `npm run acc:list-accounts`.
  - Add `npm run acc:list-companies -- --account <id>`.
  - Add `npm run acc:list-project-users -- --account <id> --project <id>`.
  - Add `npm run acc:find-company -- --account <id> --name "Prime Controls"`.
  - Add `npm run acc:inspect-assignees -- --project <id>`.
  - Add `npm run acc:list-asset-categories -- --project <id>`.
  - [x] Add `npm run site:validate -- --config /app/config/sites.json`.

- [x] **Make discovery output useful for configuration**
  - Print readable tables containing names, IDs, types, account/project relationships, and other useful metadata.
  - Add an optional JSON output mode that can feed site configuration generation.
  - Handle Autodesk pagination for every listing command.
  - Clearly report missing scopes, insufficient account permissions, expired authentication, and inaccessible projects.
  - Avoid requiring operators to infer company or member IDs by downloading issues or assets.

- [ ] **Document Autodesk discovery requirements**
  - Document the difference between Data Management hubs/projects and ACC Admin accounts/projects/users/companies.
  - Confirm and document the required OAuth scopes, including `account:read` where applicable.
  - Document the account and project permissions required by the authenticated Autodesk user.
  - Document how discovered project, company, member, and asset-category IDs map into site configuration.

## Priority 3: Define persistent storage

- [x] **Introduce explicit data and configuration roots**
  - Add `DATA_DIR=/app/data`.
  - Add `SITES_CONFIG_PATH=/app/config/sites.json`.
  - Add `BACKUP_DIR=/app/backups`.
  - Update all database and file utilities to resolve mutable paths from `DATA_DIR`, not from the source directory.
  - Reject paths that escape their configured root.

- [x] **Move all mutable state to persistent storage**
  - Site-specific issues databases
  - Site-specific assets databases
  - Site-specific commissioning databases
  - `sessions.db`
  - Contacts and location mappings
  - Uploaded schedules
  - Building and room images
  - Imported Excel files
  - Other administrator-uploaded files

- [x] **Keep runtime data out of container images**
  - Mount `/app/data` as a named volume or host volume.
  - Mount `/app/config` read-only where practical.
  - Do not bake live databases, sessions, uploads, customer spreadsheets, or backups into an image.
  - Add runtime-data paths to `.dockerignore`.

## Priority 4: Define the deployment model

- [ ] **Support a safe single-instance deployment first**
  - Run a frontend/reverse-proxy container and one backend container.
  - Mount persistent storage into the backend container.
  - Set `WEB_CONCURRENCY=1`.
  - Preserve and test the checks in `backend/src/utils/singleInstanceGuard.js`.
  - Document that SQLite, local uploads, and the in-process issue scheduler require exactly one backend replica.

- [ ] **Document the path to horizontal scaling**
  - Move relational data and sessions from SQLite to PostgreSQL.
  - Move schedules, contacts, drawings, imports, and uploads to shared object storage.
  - Move scheduled issue refreshes into a separate worker or job service.
  - Add distributed locking so only one worker refreshes a project at a time.
  - Make backend containers stateless before increasing the replica count.

## Priority 5: Create Docker artifacts

- [x] **Create the backend image**
  - Add `backend/Dockerfile`.
  - Use a pinned Node LTS base image.
  - Use `npm ci --omit=dev` for the production dependency installation.
  - Account for the native `better-sqlite3` dependency and its required build/runtime libraries.
  - Use a non-root runtime user.
  - Create required writable data directories during startup.
  - Expose port `3001`.
  - Add a health check against `/health`.
  - Ensure `SIGTERM` closes the scheduler, session store, and all SQLite connections cleanly.

- [x] **Create the frontend image**
  - Add `Frontend/building-webapp/Dockerfile`.
  - Build the Vite application in a build stage.
  - Serve the generated `dist` directory from a small web-server image such as Nginx or Caddy.
  - Configure history fallback for React routes.
  - Proxy `/api` and `/health` to the backend so the browser can use one public origin.
  - Do not include source-only customer resources in the runtime image.

- [x] **Create local orchestration**
  - Add a root `docker-compose.yml`.
  - Define frontend and backend services.
  - Define the persistent data volume.
  - Define read-only configuration mounts where appropriate.
  - Add service health checks and startup dependencies.
  - Set `restart: unless-stopped` or the chosen deployment policy.
  - Do not commit real secret values in the Compose file.

- [x] **Add supporting Docker files**
  - Add root and service-specific `.dockerignore` files as appropriate.
  - Add an Nginx or Caddy configuration for frontend serving and API proxying.
  - Add a container entrypoint/startup script for validation and directory initialization.
  - Add a Docker-specific environment example.
  - Pin important image versions instead of relying on floating tags.

## Priority 6: Environment variables and secrets

- [ ] **Supply secrets only at runtime**
  - `APS_CLIENT_ID`
  - `APS_CLIENT_SECRET`
  - `APS_CALLBACK_URL`
  - `SESSION_SECRET`
  - `SITE_ACCESS_PIN`
  - `SYNC_PIN`
  - `FRONTEND_URL`

- [ ] **Protect secret material**
  - Ensure `backend/.env` and all local environment copies are excluded from Git and Docker build contexts.
  - Keep example environment files free of real credentials and customer IDs.
  - Use Docker secrets or the hosting provider's secret manager in production.
  - Never pass secrets through frontend variables, image build arguments, logs, or committed configuration.

- [ ] **Validate public URLs and cookies**
  - Make production startup reject localhost frontend and OAuth callback URLs.
  - Register the final HTTPS callback URL in the Autodesk application.
  - Decide whether the frontend and backend are same-origin or cross-origin.
  - Configure `TRUST_PROXY`, secure cookies, and `SameSite` for the selected topology.
  - Test login, callback, session restoration, and logout through the public reverse proxy.

## Priority 7: Initialization and configuration validation

- [ ] **Add a container startup preflight**
  - [x] Confirm that the site configuration exists and parses successfully.
  - [x] Confirm site IDs are present, valid, and unique.
  - [x] Confirm `DEFAULT_SITE_ID` exists when configured.
  - [x] Confirm every site has at least one allowed ACC project.
  - [x] Confirm each default project belongs to the corresponding site.
  - [x] Confirm database and static-data paths remain inside `DATA_DIR`.
  - [x] Reject Windows absolute paths in a Linux container.
  - Validate company, member, project, and category ID formats where practical.
  - [x] Confirm required directories exist or can be created and are writable.
  - Confirm required secrets and public URLs are valid.
  - [x] Initialize or migrate SQLite schemas before accepting traffic.
  - [x] Exit with a clear, actionable error if validation fails.

- [ ] **Make first-run initialization explicit**
  - [x] Define whether empty site databases are created automatically or by a setup command.
  - Define how initial contacts, mappings, and building directories are created.
  - [x] Ensure initialization is idempotent and does not overwrite existing data.
  - Document how to add a site without rebuilding the image.

## Priority 8: Backups and lifecycle behavior

- [ ] **Make backups container-aware**
  - Continue using SQLite-aware backup operations rather than copying live `.db` files directly.
  - Include contacts, schedules, mappings, drawings, imported spreadsheets, and other mutable files.
  - Write backups outside the primary application data volume when possible.
  - Configure retention and disk-space monitoring.
  - Ensure backup jobs use the same `DATA_DIR` and `BACKUP_DIR` configuration as the application.

- [ ] **Test restore and upgrade workflows**
  - Restore a backup into a fresh Compose deployment.
  - Verify every configured site's issues, assets, commissioning data, schedules, contacts, and drawings.
  - Confirm replacing or upgrading containers does not replace the persistent data volume.
  - Document rollback procedures for both application images and database/schema changes.

## Priority 9: Documentation

- [ ] **Add Docker documentation to the repository**
  - Document prerequisites and supported Docker/Compose versions.
  - Document initial environment and site configuration.
  - Document local startup and shutdown commands.
  - Document data, configuration, and backup mounts.
  - Document Autodesk OAuth callback setup.
  - Document how to run ACC discovery commands.
  - Document how to add or remove a site without changing source code.
  - Document backup, restore, upgrade, and troubleshooting procedures.
  - Clearly state the one-backend-replica limitation.

## Priority 10: Tests and acceptance criteria

- [ ] `docker compose up --build` works on a clean machine.
- [ ] No locally installed Node.js runtime is required to run the application.
- [x] No Windows-only path is required inside the containers.
- [x] Neither TTX nor TXE is required for the application to start.
- [x] A new site can be added through mounted configuration and data without rebuilding an image.
- [x] The frontend retrieves sites, projects, buildings, and rooms dynamically.
- [x] The backend rejects project IDs that are not configured for the selected site.
- [ ] ACC discovery commands list accessible hubs, accounts, projects, companies, users, assignees, and asset categories.
- [x] Discovery commands support pagination and optional JSON output.
- [ ] Sessions survive backend container recreation.
- [ ] Issues, assets, and commissioning data survive backend container recreation.
- [ ] Uploaded schedules, contacts, mappings, drawings, and imported spreadsheets survive container recreation.
- [ ] OAuth login and callback work through the public HTTPS URL.
- [ ] Secure cookies work correctly through the reverse proxy.
- [ ] Scheduled issue refresh runs once and not once per accidental replica.
- [ ] Graceful container shutdown does not corrupt SQLite databases.
- [ ] Backup and restore work in the containerized environment.
- [ ] Health checks report application readiness accurately.
- [ ] Production images contain no `.env` files, credentials, OAuth tokens, customer data, live databases, or backups.
- [ ] Backend and frontend automated tests pass against the containerized services.

## Recommended implementation order

1. Externalize and validate site configuration.
2. Add ACC discovery scripts and project authorization validation.
3. Centralize all mutable paths under `DATA_DIR`.
4. Remove frontend TTX/TXE and project hard-coding.
5. Add backend and frontend Dockerfiles, reverse-proxy configuration, and Compose orchestration.
6. Add startup initialization and validation.
7. Test storage persistence, OAuth, cookies, graceful shutdown, backups, and restores.
8. Document deployment and site onboarding.
