# ACC Issue Display

Web-based tool for viewing Autodesk Construction Cloud (ACC) Issues. Syncs issues from ACC API to a local SQLite database and displays them in a filterable table.

The backend automatically refreshes ACC issues hourly using securely persisted Autodesk refresh tokens. See [Automatic ACC issue refresh](docs/HOURLY_ISSUE_REFRESH.md) for configuration and failure visibility.

The dashboard is protected by a server-verified website access PIN that is separate from the administrative PIN. See [Website access PIN](docs/WEBSITE_ACCESS_PIN.md) for setup.

## Features

- **3-Legged OAuth Authentication** with Autodesk
- **Local SQLite Database** for persistent storage
- **Filtered Queries** - Only fetches open issues assigned to specified user
- **Search & Filter** - By issue number, title, status, and due date
- **Issue Management** - Delete issues locally, link directly to ACC
- **Auto-sort** - Issues sorted by due date (earliest first)

## Tech Stack

**Backend:** Node.js, Express, SQLite, Axios
**Frontend:** React 19, Vite

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd "C:\ACC issue display\ACCIssueDisplay\backend"
npm.cmd run dev

# Frontend
cd "C:\ACC issue display\ACCIssueDisplay\Frontend\building-webapp"
npm.cmd run dev
```

# Website
http://localhost:5173

### 2. Configure Backend

Create `backend/.env` from `backend/.env.example`:

```env
# APS Credentials (from https://aps.autodesk.com/myapps)
APS_CLIENT_ID=<set-in-environment>
APS_CLIENT_SECRET=<set-in-environment>
APS_CALLBACK_URL=http://localhost:3001/api/auth/callback

********************************************************************************
********************************************************************************
# CHANGE THESE VALUES FOR EACH ACC PROJECT/SITE
ACC_PROJECT_ID=your_project_id_here
ACC_ASSIGNED_TO_ID=your_assigned_to_user_id_here
********************************************************************************
********************************************************************************

# Server Config
PORT=3001
SESSION_SECRET=<set-in-environment>
SYNC_PIN=<set-in-environment>
FRONTEND_URL=http://localhost:5173
```

### 3. Get APS Credentials

1. Go to [https://aps.autodesk.com/myapps](https://aps.autodesk.com/myapps)
2. Create a new app
3. Add callback URL: `http://localhost:3001/api/auth/callback`
4. Enable **ACC/BIM 360 API** access
5. Copy Client ID and Client Secret to `.env`

********************************************************************************
********************************************************************************
### 4. Get Project-Specific Values (REQUIRED FOR EACH SITE)

**ACC_PROJECT_ID:**
- Navigate to your ACC project in browser
- Extract from URL: `https://acc.autodesk.com/build/files/projects/{PROJECT_ID}`
- Example: `b38e25ea-eca5-4a70-9f0b-85eeb399056f`

**ACC_ASSIGNED_TO_ID:**
- This is the Autodesk User ID for the company/user you want to filter by
- Filters queries to only show issues assigned to this user
- Example: `277458593` (Prime Controls Display UserID for TTX site)
- **MUST be updated for each construction site**

**How to find Assigned To ID:**
1. Sync issues without filter (use `PLACEHOLDER_ASSIGNED_TO_ID`)
2. View issues in the table
3. Find the user ID in the issue data
4. Update `.env` with the correct ID
5. Re-sync to get filtered results
********************************************************************************
********************************************************************************

### 5. Start Servers

```bash
# Backend (from backend directory)
npm run dev
# Runs on http://localhost:3001

# Frontend (from Frontend/building-webapp directory)
npm run dev
# Runs on http://localhost:5173
```

### 6. Use the App

1. Open `http://localhost:5173/issues`
2. Click **"Login with Autodesk"**
3. Authenticate with your Autodesk account
4. Click **"Re-query ACC API"** to sync issues
5. View, filter, and manage issues

## API Endpoints

### Authentication
- `GET /api/auth/login` - Initiate OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/logout` - Logout

### Issues
- `GET /api/issues` - Get all issues from local database
- `POST /api/issues/sync` - Sync issues from ACC API (requires auth)
- `GET /api/issues/sync-status` - Get sync metadata
- `DELETE /api/issues/:issueId` - Delete issue from local database

## API Filters Applied

All sync requests automatically filter for:
- **Status:** `open` (only open issues)
- **Assigned To:** Value from `ACC_ASSIGNED_TO_ID` (if not placeholder)

## Table Features

### Displayed Columns
- **ID** - Issue number (e.g., #37190)
- **Title** - Issue title with description preview
- **Status** - Color-coded status badge
- **Assigned To** - Assigned user name
- **Created** - Creation date
- **Due Date** - Due date (sorted earliest first)
- **Actions** - Link to ACC and Delete buttons

### Filters
- **Issue Number** - Search by display number (e.g., 37190)
- **Title** - Text search in issue titles
- **Status** - Filter by Open, Closed, In Progress, Pending
- **Due Date Sort** - Earliest First or Latest First

### Actions
- **🔗 Link** - Opens issue in ACC web interface
- **🗑️ Delete** - Removes issue from local database (reappears on next sync)

## Database Schema

The SQLite database stores:
- Issue ID, display_id (human-readable number)
- Title, description, status, priority
- Assigned to, owner, created by (names and IDs)
- Timestamps: created, updated, due date, synced at
- Location, container ID, raw API response (JSON)

## Security Notes

- Access tokens stored in server-side sessions only
- Session cookies are httpOnly
- CORS restricted to frontend URL
- Never commit `.env` file to version control
- Use HTTPS in production

## Troubleshooting

**Backend won't start:**
- Check Node.js version (18+)
- Verify all `.env` variables are set
- Check port 3001 is available

**Authentication fails:**
- Verify APS client ID/secret in `.env`
- Check callback URL matches APS app settings exactly
- Ensure ACC API is enabled in APS app

**No issues returned:**
- Verify `ACC_PROJECT_ID` is correct
- Check `ACC_ASSIGNED_TO_ID` matches a valid user
- Ensure authenticated user has access to the project
- Check backend console for API errors

**Wrong issues showing:**
- Verify `ACC_ASSIGNED_TO_ID` is correct for this site
- Check filter is set to "open" status
- Re-sync after changing `.env` values

## Support

- APS Documentation: https://aps.autodesk.com/en/docs/
- ACC Issues API: https://aps.autodesk.com/en/docs/acc/v1/reference/http/issues-issues-GET/
