# Agent TODO: Production Hosting Readiness

- [ ] **1. Configure the production Autodesk OAuth callback URL**
  - Register the final HTTPS callback URL in the Autodesk application settings.
  - Example: `https://resources.example.com/api/auth/callback`
  - Confirm login, callback, logout, and session restoration work on the production domain.

- [x] **2. Move secrets into hosting environment variables**
  - Store the Autodesk client ID and client secret outside the repository.
  - Store the sync PIN and Express session secret as environment variables.
  - Verify that no secrets are committed to Git, frontend bundles, logs, or documentation.
    ""STEP IS COMPLETE"

- [x] **3. Replace the in-memory Express session store**
  - Configure a production-compatible persistent session store.
  - Ensure authenticated sessions survive backend restarts and deployments.
  - Configure session expiration and cleanup.
      ""STEP IS COMPLETE"

- [ ] **4. Add application-level access control**
  - Deferred implementation reference: [`docs/TASK_4_ACCESS_CONTROL_CHANGES.txt`](docs/TASK_4_ACCESS_CONTROL_CHANGES.txt)
  - The referenced changes are intentionally inactive until Autodesk ACC authentication supports the required workflow.
  - Require authentication before users can access private dashboard pages and API data.
  - Define which employees or domains are authorized.
  - Return appropriate `401` and `403` responses from protected API routes.
  - Confirm Autodesk authentication is not being treated as the only authorization boundary.

- [x] **5. Harden production cookies and proxy settings**
  - Enable `secure` and `httpOnly` session cookies.
  - Select the appropriate `sameSite` policy for the Autodesk OAuth flow.
  - Configure Express `trust proxy` when deployed behind Render, Cloudflare, Caddy, Nginx, or another reverse proxy.
  - Verify cookies work only over HTTPS and are not exposed to frontend JavaScript.
  ""STEP IS COMPLETE"

- [ ] **6. Remove sensitive values from URL query strings**
  - Stop sending the sync PIN in the sync-progress URL.
  - Send sensitive values through an authenticated request body or secure server-side workflow.
  - Confirm sensitive values do not appear in browser history, access logs, monitoring tools, or referrer headers.
   ""STEP IS COMPLETE"

- [x] **7. Implement reliable backups**
  - Back up every site SQLite database and all uploaded schedules, contacts, drawings, and configuration files.
  - Use SQLite-aware backup procedures instead of copying a database during an active write.
  - Automate the backup schedule and retention policy.
  - Regularly test restoring the application from a backup.
     ""STEP IS COMPLETE"

- [x] **8. Keep SQLite deployments on one backend instance**
  - Configure the host to run only one application instance while SQLite is in use.
  - Do not enable horizontal autoscaling against locally mounted SQLite files.
  - If multiple backend instances become necessary, migrate relational data to PostgreSQL and uploaded files to shared object storage.
       ""STEP IS COMPLETE"

- [ ] **9. Automatically re-query ACC issues every hour**
  - Schedule an automatic ACC issue refresh once per hour.
  - If possible, reuse securely saved credentials, OAuth tokens, or the existing authenticated session so users do not need to log in to ACC for every refresh.
  - Securely store and refresh authentication tokens, and require an interactive login only when the saved authorization can no longer be renewed.
  - Log refresh failures and expose the last successful refresh time so authentication or synchronization problems are visible.
         ""STEP IS COMPLETE"

- [ ] **10. Create a project configuration page**
  - Allow authorized users to add, edit, and remove ACC projects.
  - Configure asset categories and other settings that differ between projects.
  - Store project-specific identifiers, display names, mappings, filters, and synchronization options in one place.
  - Validate configuration changes and confirm before deleting a project or other settings that may contain associated data.
