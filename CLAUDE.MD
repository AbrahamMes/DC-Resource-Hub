# ACC Issue Display - Project Overview

## Project Description
Web application for displaying and managing ACC (Autodesk Construction Cloud) project data including:
- Issues tracking
- Assets management with Excel file filtering
- Building/location views with image viewer
- Contacts management
- Commissioning reports

## Architecture

### Backend
- **Location**: `backend/`
- **Technology**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Port**: 3001
- **Features**:
  - 3-legged OAuth authentication with Autodesk
  - RESTful API endpoints
  - Server-Sent Events (SSE) for sync progress
  - Assets synchronization from ACC API
  - Excel file integration for asset filtering

### Frontend
- **Location**: `Frontend/building-webapp/`
- **Technology**: React 19 + Vite (rolldown-vite)
- **Port**: 5173 (default Vite dev server)
- **Features**:
  - React Router for navigation
  - Image viewer with zoom/pan (react-zoom-pan-pinch)
  - Real-time sync progress display
  - Filter and search capabilities

## Key Files

### Backend
- `backend/src/server.js` - Main server entry point
- `backend/src/controllers/assetsController.js` - Assets API logic
- `backend/src/models/assetsDatabase.js` - SQLite database model
- `backend/src/routes/assets.js` - Assets routes
- `backend/data/Asset List_Rev10.xlsx` - Excel reference file for asset filtering
- `backend/.env` - Environment variables (CLIENT_ID, CLIENT_SECRET, etc.)

### Frontend
- `Frontend/building-webapp/src/App.jsx` - Main app component
- `Frontend/building-webapp/src/pages/Assets.jsx` - Assets page with sync functionality
- `Frontend/building-webapp/src/pages/Issues.jsx` - Issues tracking page
- `Frontend/building-webapp/src/components/Hotbar.jsx` - Navigation component

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
- `ACC_PROJECT_ID` - Default ACC project ID

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

## Recent Updates (2025-12-30)

### Asset Sync Improvements
1. **Increased sync limit**: Changed from 10,100 to 20,000 assets (200 API requests)
2. **Store all assets**: Now stores ALL ACC assets in database with `excel_data` flag
3. **Filter on retrieval**: Assets are filtered by Excel match on display, not on sync
4. **PIN protection**: Added PIN (1725) requirement for re-sync to confirm intention
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

## Next Steps
1. Test asset re-sync with PIN and verify all ~11,000 assets are stored
2. Verify Excel data (Category, Location) merges correctly with ACC data
3. Test commissioning form with real data
4. Consider adding export functionality for commissioning log

## Notes
- Assets are filtered by names in Excel file (`Asset List_Rev10.xlsx`)
- Sync uses SSE for real-time progress updates
- Authentication uses 3-legged OAuth flow
- Frontend makes EventSource connection for sync progress
