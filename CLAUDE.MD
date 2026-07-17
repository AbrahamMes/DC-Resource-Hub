# ACC Issue Display - Project Overview

## Project Description
Web application for displaying and managing ACC (Autodesk Construction Cloud) project data including:
- Issues tracking
- Assets management with Excel file filtering
- Building/location views with image viewer
- Contacts management
- Commissioning reports

**Multi-Site Support**: The application supports multiple data center sites (TTX, TXE) with complete data isolation, site-specific configurations, and easy switching between sites via a dropdown selector.

## Architecture

### Multi-Site Architecture ⭐ NEW
- **Single Unified Codebase**: One backend, one frontend serving all sites
- **Site-Specific Data**: Each site has its own databases, Excel files, and static assets
- **Site Selector**: Dropdown in navigation bar for switching between sites
- **Data Isolation**: Complete separation of data between sites (TTX, TXE, etc.)
- **Easy Expansion**: Adding new sites is a configuration change, not code duplication
- **Shared Authentication**: Single OAuth login works across all sites

### Backend
- **Location**: `backend/`
- **Technology**: Node.js + Express
- **Database**: SQLite (better-sqlite3) - **site-specific databases**
- **Port**: 3001
- **Features**:
  - 3-legged OAuth authentication with Autodesk
  - Multi-site support with site context middleware
  - RESTful API endpoints with site parameter
  - Server-Sent Events (SSE) for sync progress
  - Assets synchronization from ACC API
  - Excel file integration for asset filtering
  - Site-aware database connection manager
  - Static file serving per site

### Frontend
- **Location**: `Frontend/building-webapp/`
- **Technology**: React 19 + Vite (rolldown-vite)
- **Port**: 5173 (default Vite dev server)
- **Features**:
  - React Router for navigation
  - Site Context Provider for multi-site support
  - Site selector dropdown in navigation
  - Image viewer with zoom/pan (react-zoom-pan-pinch)
  - Real-time sync progress display
  - Filter and search capabilities
  - localStorage persistence for site selection

## Key Files

### Backend (Multi-Site)
- `backend/src/server.js` - Main server entry point with multi-site routes
- `backend/src/config/sites.js` - **Centralized site configuration (TTX, TXE, etc.)**
- `backend/src/middleware/siteContext.js` - **Site validation and context**
- `backend/src/models/databaseManager.js` - **Site-aware database connections**
- `backend/src/routes/sites.js` - Sites metadata API
- `backend/src/routes/static.js` - Site-specific static file serving
- `backend/src/controllers/assetsController.js` - Assets API logic (site-aware)
- `backend/src/controllers/issuesController.js` - Issues API logic (site-aware)
- `backend/src/controllers/commissioningController.js` - Commissioning API logic (site-aware)
- `backend/data/TTX/` - Temple, TX site data directory
- `backend/data/TXE/` - El Paso, TX site data directory
- `backend/.env` - Environment variables (CLIENT_ID, CLIENT_SECRET, etc.)

### Frontend (Multi-Site)
- `Frontend/building-webapp/src/App.jsx` - Main app with SiteProvider
- `Frontend/building-webapp/src/contexts/SiteContext.jsx` - **Site selection context**
- `Frontend/building-webapp/src/components/Hotbar.jsx` - **Navigation with site dropdown**
- `Frontend/building-webapp/src/pages/Assets.jsx` - Assets page (site-aware)
- `Frontend/building-webapp/src/pages/Issues.jsx` - Issues page (site-aware)
- `Frontend/building-webapp/src/pages/Buildings.jsx` - Buildings list (site-aware)
- `Frontend/building-webapp/src/pages/BuildingView.jsx` - Building rooms view
- `Frontend/building-webapp/src/pages/RoomView.jsx` - Room floor plan view

## Starting the Servers

### Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

### Frontend
```bash
cd Frontend/building-webapp
npm run dev
# Dev server runs on http://localhost:5173
```

## Current Issues

### UI/UX Issues Across All Pages (Except Buildings)

#### Home Page
- [ ] **Empty page syndrome**: Page only shows a title and one sentence - needs more content/purpose
- [ ] **Missing welcome content**: Should have quick links to main features, recent activity, or project overview
- [ ] **No visual hierarchy**: Plain text on dark background with no cards, panels, or visual structure

#### Schedules Page
- [ ] **No page title/heading**: Page starts directly with buttons, missing "Schedules" heading
- [ ] **Button grouping**: Two buttons (Schedule JPG, 6-Week PDF) lack visual grouping or container
- [ ] **Schedule image sizing**: Large schedule image has no zoom/pan controls (unlike Buildings page image viewer)
- [ ] **No loading state**: Image loads without spinner or placeholder
- [ ] **Accessibility**: Schedule image lacks alt text for screen readers
- [ ] **Mobile responsiveness**: Large schedule image likely problematic on mobile devices

#### Contacts Page
- [ ] **Filter input styling**: Search/filter textbox appears plain with minimal styling
- [ ] **Filter label disconnected**: "Filter:" label not visually connected to input field
- [ ] **Table density**: Table rows could benefit from hover states for better scanability
- [ ] **Email links**: Emails displayed as plain text instead of clickable mailto: links
- [ ] **Phone links**: Phone numbers not clickable (should be tel: links for mobile)
- [ ] **Column spacing**: Some columns (like Area/Equipment) could use better width allocation
- [ ] **No empty state**: Missing message for when filter returns no results

#### Issues Page
- [ ] **Login CTA placement**: "Login with Autodesk" button appears before explanation of what it does
- [ ] **Loading state persistent**: "Loading issues..." shows even before user attempts to load
- [ ] **Tip formatting**: Emoji + tip text could be styled as an info card/banner instead of plain paragraph
- [ ] **Database display**: Shows "Database: 777 issues | Last Sync: 12/30/2025" but user hasn't synced yet
- [ ] **Filter UI inconsistency**: Filter inputs use different styling than Contacts page filter
- [ ] **Issue cards truncation**: Long issue descriptions get cut off with no expand option
- [ ] **Status badges**: Status colors ("open" in light blue) have low contrast on white background
- [ ] **Action buttons**: Blue "🔗 Link" buttons are small and could be more prominent
- [ ] **Due date formatting**: Dates in MM/DD/YYYY could be more readable (e.g., "Dec 21, 2025")
- [ ] **Sort controls**: "Sort by Due Date" dropdown not visually distinct from filter controls
- [ ] **Mobile table**: Wide table with many columns likely problematic on mobile

#### Assets Page
- [ ] **Dual login buttons**: Both "Login with Autodesk" and "Re-query ACC API" appear before login
- [ ] **Button hierarchy**: Re-query button has same visual weight as login button
- [ ] **Loading state persistent**: "Loading assets..." shows even before user attempts to load
- [ ] **Tip formatting**: Same issue as Issues page - emoji + tip as plain paragraph
- [ ] **Database display**: Shows stats before any sync has occurred
- [ ] **Filter layout**: Three separate filter sections could be consolidated into one filter bar
- [ ] **Category dropdown**: "All Categories" dropdown very long, could benefit from search
- [ ] **Status dropdown**: Similar issue with long dropdown list
- [ ] **Search inputs**: Multiple search fields but inconsistent styling
- [ ] **Table density**: Asset table rows very tight, could use more padding
- [ ] **Link buttons**: Small blue "🔗 Link" buttons difficult to tap on mobile
- [ ] **Barcode display**: Long barcodes not formatted or wrapped properly
- [ ] **Location hierarchy**: Location shows as "DCE5 > AREA A > Ground > 1A1" - could be formatted better
- [ ] **Category wrapping**: Long category names wrap awkwardly
- [ ] **No empty state**: Missing message for when filters return no results

#### Commissioning Report Page (Commis. Log)
- [ ] **Tab styling**: Two tabs (Daily Form, Commissioning Log) lack active state indication
- [ ] **Form field spacing**: Form fields very close together, needs more whitespace
- [ ] **Required field indicator**: Location field marked with asterisk but no legend explaining required fields
- [ ] **Label alignment**: Labels not consistently aligned with their inputs
- [ ] **Textarea sizing**: All textareas same size regardless of expected content length
- [ ] **Submit button disabled**: Button appears disabled with no explanation of why
- [ ] **Initials prompt note**: Note about initials prompt is easy to miss
- [ ] **Dropdown width**: Location dropdown very wide, takes full width unnecessarily
- [ ] **Optional field indicators**: "(Optional)" text could be styled more subtly
- [ ] **Field grouping**: Related fields not visually grouped
- [ ] **No validation feedback**: No inline validation or error messages shown
- [ ] **Tab content**: Second tab (Commissioning Log) not visible in screenshot - needs review

#### Navigation/Global Issues
- [ ] **Nav link truncation**: "Commis. Log" truncated - should show full "Commissioning Log"
- [ ] **Active state**: Current page not clearly indicated in navigation
- [ ] **Nav hover state**: No visual feedback when hovering over nav links
- [ ] **Responsive nav**: Navigation likely problematic on mobile (7 links, some with long names)
- [ ] **Page spacing**: All pages lack consistent padding/margins from edges
- [ ] **Dark theme consistency**: Some elements (buttons, inputs) don't match dark theme well
- [ ] **Loading indicators**: No consistent loading spinner/skeleton component across pages
- [ ] **Error states**: No error messages or retry options visible anywhere
- [ ] **Scrollbar styling**: Default scrollbars don't match dark theme aesthetic

### Assets Page Pagination Bug
**Status**: FIXED ✅

**Description**:
Assets sync was only retrieving 100 assets (after 2 requests) instead of all assets from the ACC project. The second request would return all duplicates and stop.

**Root Cause**:
The ACC Assets API v2 uses **cursor-based pagination**, not offset-based pagination. The code was using `offset` parameter to paginate, but the API requires the `cursorState` token to properly track position in the result set.

**Location**:
- Backend: `backend/src/controllers/assetsController.js` (syncAssetsWithProgress and syncAssets functions)

**Problems**:
1. ❌ Using `offset` parameter instead of `cursorState` token
2. ❌ Not reading `cursorState` from pagination response
3. ❌ Incrementing offset manually (`offset += limit`) instead of using API's cursor
4. Result: API kept returning the same first 100 assets on every request

**Solution Implemented**:
Switched to proper cursor-based pagination:

1. **Cursor-Based Pagination**: Use `cursorState` from API response instead of manual offset
2. **NextUrl Detection**: Stop when `pagination.nextUrl` is null/missing
3. **Duplicate Detection**: Track asset IDs to catch any pagination issues
4. **Safety Limits**: Stop after 100 requests or 10,000 assets as failsafe

**Code After Fix**:
```javascript
let cursorState = null; // For cursor-based pagination

while (hasMore) {
  // Build params - use cursorState if we have it from previous request
  const params = { limit: 100 };
  if (cursorState) {
    params.cursorState = cursorState;
  }

  const response = await axios.get(baseUrl, { headers, params });
  const pagination = response.data.pagination || {};

  // Update cursorState for next request from pagination metadata
  if (pagination.cursorState) {
    cursorState = pagination.cursorState;
  }

  // Stop when no nextUrl (API indicates end of results)
  if (!pagination.nextUrl) {
    hasMore = false;
  }
}
```

**API Response Structure**:
```json
{
  "results": [...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "cursorState": "eyJsaW1pdCI6MTAwLCJvZmZzZXQiOjEwMH0=",
    "nextUrl": "https://.../assets?limit=100&cursorState=..."
  }
}
```

**Testing**: Fixed - now properly fetches all assets using cursor-based pagination

## Authentication Flow
1. User clicks "Login with Autodesk" on Assets page
2. Backend generates OAuth URL and redirects user
3. User authenticates with Autodesk
4. Autodesk redirects back to callback URL with auth code
5. Backend exchanges code for access token
6. Access token stored in session
7. Frontend uses token for ACC API calls

## Environment Variables
Required in `backend/.env`:
- `CLIENT_ID` - Autodesk app client ID
- `CLIENT_SECRET` - Autodesk app client secret
- `CALLBACK_URL` - OAuth callback URL
- `SESSION_SECRET` - Express session secret
- ~~`ACC_PROJECT_ID`~~ - **DEPRECATED** (now in sites.js per site)
- ~~`ACC_ASSIGNED_TO_ID`~~ - **DEPRECATED** (now in sites.js per site)

**Note**: ACC project IDs and assigned-to IDs are now configured per site in `backend/src/config/sites.js`

## Dependencies

### Backend
- express - Web framework
- axios - HTTP client for ACC API
- better-sqlite3 - SQLite database
- express-session - Session management
- xlsx - Excel file parsing
- cors - CORS middleware
- dotenv - Environment variables

### Frontend
- react 19.2.0 - UI framework
- react-router-dom - Routing
- react-zoom-pan-pinch - Image viewer
- vite (rolldown-vite) - Build tool

## Database Schema

### Assets Table
```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  description TEXT,
  location TEXT,
  status TEXT,
  barcode TEXT,
  discipline TEXT,
  equipment_type TEXT,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  meta_part_number TEXT,
  warranty_start_date TEXT,
  warranty_end_date TEXT,
  container_id TEXT,
  synced_at TEXT,
  raw_data TEXT
);
```

### Assets Not Displaying After Sync (0 Matches)
**Status**: FIXED ✅

**Description**:
After fixing the pagination issue, the sync would successfully fetch 10,100 assets from ACC but 0 would match the Excel file (which has 2,974 assets). The page would not display any assets despite successful API calls.

**Root Cause**:
The ACC Assets API v2 returns asset names in the `clientAssetId` field, NOT in `name` or `assetName` fields. The code was checking `asset.name || asset.assetName` which were both undefined, resulting in empty strings for all asset names.

**Location**:
- Backend: `backend/src/controllers/assetsController.js` (lines 182, 234, 338)

**Problems**:
1. ❌ Filtering logic used `asset.name || asset.assetName` (both undefined)
2. ❌ Database insert used same incorrect field mapping
3. ❌ Result: All asset names were empty strings "", causing 0 matches with Excel

**Solution Implemented**:
Changed field mapping to use `clientAssetId` as primary field:

**Code After Fix**:
```javascript
// Filtering (line ~182)
const assetName = asset.clientAssetId || asset.name || asset.assetName || '';

// Database insert (line ~234 and ~338)
name: asset.clientAssetId || asset.name || asset.assetName || '',
```

**Testing**: Server auto-restarted with fix. Ready to test sync with correct asset name field.

## Recent Updates

### Multi-Site Architecture Implementation (2026-01-09)
**Complete transformation from single-site to multi-site architecture:**

1. **Backend Changes**:
   - Created centralized site configuration system (`sites.js`)
   - Implemented site context middleware for request handling
   - Built site-aware database manager with connection caching
   - Updated all controllers to use site-specific databases
   - Created Sites API for site metadata retrieval
   - Created Static File API for per-site asset serving
   - Migrated existing TTX data to new structure

2. **Frontend Changes**:
   - Created React Site Context Provider for site management
   - Added site selector dropdown to navigation bar
   - Updated all pages to be site-aware (Issues, Assets, Buildings, etc.)
   - Implemented localStorage persistence for site selection
   - Created new RoomView page with breadcrumb navigation
   - Updated BuildingView and Buildings pages to fetch from API

3. **Data Structure**:
   - `backend/data/TTX/` - Temple, TX site data
   - `backend/data/TXE/` - El Paso, TX site data
   - Each site has separate: issues.db, assets.db, commissioning.db, Excel files, building images

4. **Key Features**:
   - Single codebase serves all sites
   - Complete data isolation between sites
   - Easy site switching via dropdown
   - Automatic redirect to home on site change
   - Site-specific building hierarchies
   - Ready for future site additions

### Asset Sync Improvements (2025-12-30)
1. **Increased sync limit**: Changed from 10,100 to 20,000 assets (200 API requests)
2. **Store all assets**: Now stores ALL ACC assets in database with `excel_data` flag
3. **Filter on retrieval**: Assets are filtered by Excel match on display, not on sync
4. **PIN protection**: Added an environment-configured PIN requirement for re-sync
5. **Excel data merging**: Category and Location from Excel file now merged with ACC data

### Commissioning Report System
Created a complete commissioning tracking system with two tabs:

**Daily Form Tab:**
- Location selection (required, dropdown from asset locations)
- Asset selection (optional, multi-select, filtered by location, searchable)
- Issues field (optional, text entry)
- Needs/Wants field (optional, text entry)
- Delays field (optional, text entry)
- Initials prompt on submission
- Records submission time automatically

**Commissioning Log Tab:**
- Groups entries by date
- Within each date, groups by location
- Combines all assets, issues, needs/wants, delays for each location/date
- Shows initials and time for each submission on the right
- Human-readable format

**Backend:**
- Database: `backend/data/commissioning.db`
- API Routes: `/api/commissioning/*`
- Controller: `backend/src/controllers/commissioningController.js`
- Routes: `backend/src/routes/commissioning.js`

## Multi-Site Implementation Details

### Site Configuration (`backend/src/config/sites.js`)
Each site requires:
- **Site ID**: Uppercase identifier (e.g., 'TTX', 'TXE')
- **Display Names**: Short name and full name
- **ACC Project IDs**: Project ID and assigned-to ID from Autodesk
- **Database Paths**: Relative paths to SQLite databases
- **Static Asset Paths**: Excel file, contacts JSON, buildings directory
- **Buildings Hierarchy**: Array of buildings with rooms and floor plan images

### Adding a New Site
**See `docs/ADD_NEW_SITE.md` for complete guide**

Quick overview:
1. Add site configuration to `sites.js`
2. Create directory structure: `backend/data/{SITE_ID}/`
3. Add building images to `backend/data/{SITE_ID}/buildings/`
4. Add site-specific Excel and contacts files
5. Restart backend server
6. Site appears automatically in dropdown

### Site Switching
- User selects site from dropdown in navigation bar
- Selection saved to localStorage
- Page redirects to home on site change
- All subsequent API calls use selected site
- Session stores site selection on backend

### Data Isolation
- Each site has completely separate databases
- No cross-contamination of data between sites
- Static files served from site-specific directories
- Buildings and rooms configured per site
- Sync operations are site-specific

### Asset Location Mapping (NEW - 2026-01-09)
**See `docs/LOCATION_MAPPING.md` for complete guide**

Display assets on room floor plans with interactive markers:

**Features**:
- Maps ACC location strings to building/room IDs via configurable JSON files
- Displays assets as clickable square markers on floor plans
- Shows asset count on each marker
- Right sidebar with searchable asset list
- Detailed asset view panel
- Support for exact matches and regex patterns

**Components**:
- `backend/data/{SITE_ID}/location_mapping.json` - Location mapping configuration
- `backend/src/utils/locationMapper.js` - Mapping logic
- `backend/src/config/sites.js` - Marker positions (x/y coordinates)
- API endpoint: `GET /api/sites/:siteId/buildings/:buildingId/rooms/:roomId/assets`

**Example Usage**:
```json
// location_mapping.json
{
  "mappings": [
    {
      "accLocation": "DCB1 > AREA A > Ground > 1A1",
      "buildingId": "ttx1",
      "roomId": "dha"
    }
  ],
  "patterns": [
    {
      "pattern": "^DCB1 > AREA A > Ground > 1A\\d+$",
      "buildingId": "ttx1",
      "roomId": "dha"
    }
  ]
}

// sites.js - Room markers
{
  id: 'dha',
  name: 'DHA',
  images: { default: 'TTX1_DHA.jpg' },
  markers: [
    { id: 'zone-1a1', x: 0.25, y: 0.35, zone: '1A1', label: 'Zone 1A1' },
    { id: 'zone-1a2', x: 0.75, y: 0.35, zone: '1A2', label: 'Zone 1A2' }
  ]
}
```

## Next Steps
1. Test multi-site functionality with both TTX and TXE
2. Configure location mappings for all rooms
3. Add marker positions to floor plan images
4. Test asset re-sync with PIN for each site
5. Test commissioning form with site-specific data
6. Add new sites as needed using ADD_NEW_SITE.md guide

## Notes
- Assets are filtered by names in site-specific Excel files
- Sync uses SSE for real-time progress updates
- Authentication uses 3-legged OAuth flow (shared across sites)
- Frontend makes EventSource connection for sync progress
- Site selection persists across browser sessions via localStorage
