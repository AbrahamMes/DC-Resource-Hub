# Add or remove a site

Sites are deployment configuration. Do not edit application source or rebuild an image.

1. Discover project, company/member, and category IDs using [Autodesk discovery](AUTODESK_DISCOVERY.md).
2. Add a site object to the mounted `backend/config/sites.json`, using `backend/config/sites.example.json` as the schema example.
3. Keep every database and static asset path relative to `DATA_DIR`.
4. Validate it:

   ```sh
   docker compose run --rm backend npm run site:validate -- --config /app/config/sites.json --initialize
   ```

5. Put contacts, mappings, building images, and imports at their configured paths in the data volume. Empty databases and required parent directories are initialized idempotently.
6. Restart the backend and verify the site selector, ACC project selector, buildings, rooms, contacts, schedules, issues, assets, and commissioning pages.

To remove a site, take and verify a backup, remove its registry entry, restart, and confirm it is no longer selectable. Preserve or archive its data directory until the retention decision is approved; configuration removal does not delete stored data.
