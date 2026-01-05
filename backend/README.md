# ACC Issues Backend

Backend service for syncing and managing Autodesk Construction Cloud (ACC) Issues with a local SQLite database.

## Features

- **3-Legged OAuth Authentication** with Autodesk Platform Services (APS)
- **Local SQLite Database** for storing issues
- **ACC Issues API Integration** for querying issues assigned to specific users
- **RESTful API** for frontend integration
- **Session Management** for maintaining authentication state

## Prerequisites

- Node.js 18 or higher
- Autodesk Platform Services (APS) account and app credentials
- ACC Project ID and Assigned To User ID

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Get these from https://aps.autodesk.com/myapps
APS_CLIENT_ID=your_client_id_here
APS_CLIENT_SECRET=your_client_secret_here
APS_CALLBACK_URL=http://localhost:3001/api/auth/callback

# Get these from your ACC project
ACC_PROJECT_ID=your_project_id_here
ACC_ASSIGNED_TO_ID=your_assigned_to_id_here

# Server config
PORT=3001
SESSION_SECRET=your_random_secret_here
FRONTEND_URL=http://localhost:5173
```

### 3. Getting Your APS Credentials

1. Go to [Autodesk Platform Services](https://aps.autodesk.com/myapps)
2. Create a new app or use an existing one
3. Add the callback URL: `http://localhost:3001/api/auth/callback`
4. Enable the following API: **BIM 360 API** or **ACC API**
5. Copy your Client ID and Client Secret

### 4. Finding Your ACC Project ID and User ID

**Project ID:**
- Navigate to your ACC project in a browser
- The URL will contain your project ID: `https://acc.autodesk.com/build/files/projects/{PROJECT_ID}`

**Assigned To ID:**
- This is the Autodesk user ID of the person you want to filter issues for
- You can find this by inspecting the ACC Issues API response or using the ACC admin console

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- **GET /api/auth/login** - Get OAuth authorization URL
- **GET /api/auth/callback** - OAuth callback handler (redirect from Autodesk)
- **GET /api/auth/status** - Check authentication status
- **POST /api/auth/logout** - Logout and clear session

### Issues

- **GET /api/issues** - Get all issues from local database
- **POST /api/issues/sync** - Sync issues from ACC API (requires authentication)
- **GET /api/issues/sync-status** - Get sync metadata (count, last sync time)

### Health Check

- **GET /health** - Server health check and configuration status

## Database Schema

Issues are stored in SQLite with the following fields:

- `id` - Issue ID from ACC
- `title` - Issue title
- `description` - Issue description
- `status` - Current status
- `priority` - Priority level
- `assigned_to` - Assigned user name
- `assigned_to_id` - Assigned user ID
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `due_date` - Due date
- `issue_type` - Type of issue
- `root_cause` - Root cause (if applicable)
- `location_description` - Location details
- `owner` - Issue owner name
- `owner_id` - Issue owner ID
- `created_by` - Creator name
- `created_by_id` - Creator ID
- `container_id` - Project/container ID
- `synced_at` - Last sync timestamp
- `raw_data` - Full JSON response from ACC API

## Authentication Flow

1. User clicks "Login with Autodesk" on frontend
2. Frontend calls `/api/auth/login` to get authorization URL
3. User is redirected to Autodesk login page
4. After successful login, Autodesk redirects to `/api/auth/callback`
5. Backend exchanges code for access token
6. Access token is stored in session
7. User is redirected back to frontend

## Syncing Issues

1. User must be authenticated
2. Click "Re-query ACC API" button on frontend
3. Backend fetches issues from ACC using stored access token
4. Issues are filtered by `assignedTo` parameter
5. Issues are stored/updated in local SQLite database
6. Frontend refreshes to show updated data

## Security Notes

- Session secret should be a strong random string in production
- Access tokens are stored in server-side sessions (not exposed to client)
- CORS is configured to only allow requests from the frontend URL
- Use HTTPS in production and set `cookie.secure: true`

## Troubleshooting

**"Not authenticated" error:**
- Click "Login with Autodesk" to authenticate
- Check that your APS credentials are correct
- Verify callback URL matches your app settings

**No issues returned:**
- Verify `ACC_PROJECT_ID` is correct
- Verify `ACC_ASSIGNED_TO_ID` matches a valid user
- Check that the authenticated user has access to the project
- Check backend logs for API errors

**OAuth callback fails:**
- Verify callback URL in `.env` matches APS app settings
- Check that your app has the correct API scopes enabled

## Development

The backend uses:
- Express.js for the web server
- better-sqlite3 for database
- axios for HTTP requests
- express-session for session management
- cors for cross-origin requests
