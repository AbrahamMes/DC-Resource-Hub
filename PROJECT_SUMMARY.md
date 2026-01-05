# ACC Issue Display - Project Summary

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Autodesk Construction Cloud (ACC) account with API access
- ACC Project ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ACCIssueDisplay
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your Autodesk API credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd Frontend/building-webapp
   npm install
   cp .env.example .env
   # Configure API URL if needed (defaults to http://localhost:3001/api)
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Project Structure

```
ACCIssueDisplay/
├── backend/                      # Node.js + Express API server
│   ├── src/
│   │   ├── config/              # Configuration management
│   │   ├── controllers/         # Business logic (auth, issues, assets, commissioning)
│   │   ├── middleware/          # Express middleware (auth)
│   │   ├── models/              # Database models (SQLite)
│   │   ├── routes/              # API route definitions
│   │   └── server.js            # Express server entry point
│   ├── data/
│   │   ├── assets.db            # Assets database (SQLite)
│   │   ├── issues.db            # Issues database (SQLite)
│   │   ├── commissioning.db     # Commissioning reports database (SQLite)
│   │   └── Asset List_Rev10.xlsx # Asset reference/filter file
│   ├── .env.example             # Environment variable template
│   └── package.json             # Backend dependencies
│
└── Frontend/
    └── building-webapp/          # React 19 + Vite application
        ├── src/
        │   ├── components/      # Reusable components (Hotbar, ImageViewer, etc.)
        │   ├── pages/           # Page components (Home, Issues, Assets, etc.)
        │   ├── data/            # Static data files (buildings, contacts)
        │   ├── assets/          # Static assets (images, PDFs)
        │   ├── config.js        # Frontend configuration
        │   ├── App.jsx          # React Router setup
        │   └── main.jsx         # React entry point
        ├── .env.example         # Frontend environment template
        └── package.json         # Frontend dependencies
```

## Key Features

### 1. Issues Management
- Sync issues from ACC API
- Filter by issue number, title, and status
- Sort by due date
- Direct links to ACC issue details
- Server-Sent Events (SSE) for real-time sync progress

### 2. Assets Management
- Sync assets from ACC API using cursor-based pagination
- Filter by Excel reference file (Asset List_Rev10.xlsx)
- Search by name or barcode
- Filter by category and status
- Store all assets with Excel data flag
- PIN-protected re-sync (configurable via `SYNC_PIN` environment variable)

### 3. Building Views
- Interactive building layouts with image viewer
- Zoom and pan capabilities (react-zoom-pan-pinch)
- Multiple view modes per building (Default, M23 Wires, M12 Wires, etc.)
- Parameterized routing (`/buildings/:id`)
- Configuration-driven building definitions

### 4. Commissioning Reports
- Daily commissioning form with location and asset selection
- Track work performed, issues, needs/wants, and delays
- Initials capture for accountability
- Commissioning log view grouped by date and location
- Export to Excel functionality

### 5. Schedules
- View project schedules (JPG and PDF formats)
- PDF viewer with zoom capability
- Default view: 6-Week PDF

### 6. Contacts
- Searchable contact directory
- Filterable by name, company, or area
- Clickable email (mailto:) and phone (tel:) links
- Empty state handling

## Architecture Decisions

### Backend
- **SQLite**: Lightweight, serverless database suitable for single-user/small team use
- **better-sqlite3**: Synchronous API for better performance and simpler code
- **Express Sessions**: Secure OAuth token storage
- **Server-Sent Events**: Real-time sync progress without WebSocket complexity
- **Cursor-based Pagination**: Proper handling of ACC API v2 pagination

### Frontend
- **React 19**: Latest features including React Compiler
- **Vite (rolldown)**: Fast build tool with minimal configuration
- **Inline Styles**: React convention for component-scoped styling
- **React Router DOM**: Client-side routing with parameterized paths
- **Configuration-driven**: Buildings and API URLs managed via config files

## Environment Variables

### Backend (.env)
```bash
# Autodesk API Credentials
APS_CLIENT_ID=your_client_id_here
APS_CLIENT_SECRET=your_client_secret_here
APS_CALLBACK_URL=http://localhost:3001/api/auth/callback

# ACC Project Configuration
ACC_PROJECT_ID=your_project_id_here
ACC_ASSIGNED_TO_ID=your_assigned_to_id_here

# Server Configuration
PORT=3001
SESSION_SECRET=your_random_session_secret_here
FRONTEND_URL=http://localhost:5173

# Security
SYNC_PIN=1725
```

### Frontend (.env)
```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Initiate OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Clear session

### Issues
- `GET /api/issues` - Get issues from local database
- `GET /api/issues/sync` - Sync issues from ACC API (SSE)
- `GET /api/issues/sync-status` - Get last sync status

### Assets
- `GET /api/assets` - Get assets from local database (filtered by Excel)
- `GET /api/assets/sync` - Sync assets from ACC API with progress (SSE)
- `GET /api/assets/sync-status` - Get last sync status

### Commissioning
- `POST /api/commissioning/submit` - Submit commissioning report
- `GET /api/commissioning/entries` - Get commissioning entries
- `GET /api/commissioning/locations` - Get available locations
- `GET /api/commissioning/assets` - Get assets for location

## Design System

### Colors
- **Primary**: #0696D7 (Autodesk blue)
- **Background**: #121212 (dark)
- **Card Background**: #1e1e1e
- **Border**: #333
- **Text**: #fff (primary), #a0a0a0 (muted)
- **Input Background**: #fff (white for filters)
- **Input Text**: #212529 (dark)

### Typography
- **Navigation**: 32px (large for readability)
- **Page Titles**: 28-36px
- **Body**: 14-16px
- **Labels**: 13px

### Spacing
- **Nav Height**: 70px
- **Card Padding**: 24px
- **Input Padding**: 8px
- **Gap/Spacing**: 16-20px

## Development Workflow

### Running in Development
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd Frontend/building-webapp && npm run dev`
3. Backend auto-restarts on file changes (--watch flag)
4. Frontend hot-reloads automatically (Vite HMR)

### Building for Production
```bash
# Frontend build
cd Frontend/building-webapp
npm run build
# Output: dist/ directory

# Backend (no build step required)
cd backend
npm start
```

## Database Schema

### Assets Table
- **Primary Key**: `id` (ACC asset ID)
- **Indexed**: name, category, status, location
- **Special Fields**:
  - `excel_data`: 'true' if asset matches Excel filter
  - `raw_data`: Full JSON from ACC API (debugging)
  - `synced_at`: Timestamp of last sync

### Issues Table
- **Primary Key**: `id` (ACC issue ID)
- **Indexed**: display_id, assigned_to_id, status, created_at
- **Special Fields**:
  - `display_id`: Human-readable issue number
  - `raw_data`: Full JSON from ACC API
  - `synced_at`: Timestamp of last sync

### Commissioning Entries Table
- **Primary Key**: `id` (auto-increment)
- **Indexed**: location, created_date, submitted_at
- **Required Fields**: location, initials, submitted_at
- **Optional Fields**: assets, work_performed, issues, needs_wants, delays

## Recent Improvements (2025-12-31)

### Code Quality
- ✅ Removed 3 unused files (templateApp.jsx, _ul, nul)
- ✅ Consolidated 6 duplicate building components into 1 reusable component
- ✅ Moved hardcoded sync PIN to environment variable
- ✅ Centralized API URL configuration
- ✅ Created frontend config system

### UI/UX
- ✅ Redesigned Home page with feature cards
- ✅ Increased navigation text size (16px → 32px)
- ✅ Standardized filter styling across pages
- ✅ Made emails and phone numbers clickable in Contacts
- ✅ Changed filter backgrounds to white with dark text
- ✅ Set 6-Week PDF as default schedule view
- ✅ Removed "Getting Started" section from Home

### Security
- ✅ Moved hardcoded PIN from source code to .env
- ✅ Added environment variable templates

## Known Limitations

### Testing
- ⚠️ No unit tests
- ⚠️ No integration tests
- ⚠️ No E2E tests

### Security
- ⚠️ No input validation middleware
- ⚠️ Session secret has default fallback
- ⚠️ No rate limiting
- ⚠️ No security headers (helmet.js)

### Technical Debt
- ⚠️ No database migrations
- ⚠️ No graceful shutdown
- ⚠️ Console.log instead of proper logging
- ⚠️ Magic numbers in code (limits, timeouts)
- ⚠️ No standardized error response format

### Production Readiness
- ⚠️ No deployment documentation
- ⚠️ No monitoring/observability setup
- ⚠️ No health check endpoints
- ⚠️ SQLite not ideal for concurrent users

## Contributing

### Code Style
- Use functional React components (hooks)
- Use inline styles for component-scoped CSS
- Follow existing naming conventions (camelCase for functions, PascalCase for components)
- Keep components small and focused
- Extract configuration to JSON files when appropriate

### Git Workflow
1. Create feature branch from main
2. Make changes with descriptive commits
3. Test locally (backend + frontend)
4. Create pull request with description
5. Address review comments
6. Merge when approved

## License
[Add license information]

## Support
[Add support contact information]
