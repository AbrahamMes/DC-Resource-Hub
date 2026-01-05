# Changelog

All notable changes to the ACC Issue Display project are documented here.

## [2025-12-31] - Major Refactoring and UI Improvements

### Added
- **Frontend Configuration System**: Created `src/config.js` for centralized frontend configuration
- **Environment Variables Support**: Added `.env.example` for frontend with VITE_API_BASE_URL
- **Building Configuration**: Created `buildingsConfig.json` to centralize building view data
- **Generic BuildingView Component**: Consolidated 6 duplicate building components into one reusable component
- **Dark Theme Consistency**: Improved filter styling across all pages with consistent white backgrounds and dark text

### Changed
- **Home Page**: Complete redesign with feature cards and improved visual hierarchy
- **Navigation Bar**: Increased font size to 32px and height to 70px for better readability
- **Schedules Page**: 6-Week PDF now set as default view instead of Schedule JPG
- **Filter Styling**:
  - Changed filter label colors from `#212529` to `#a0a0a0` across Issues and Assets pages
  - Changed filter input/select backgrounds from dark to white (`#fff`) with dark text (`#212529`)
- **Navigation Label**: Changed "Commis. Log" to "Commissioning" with enhanced hover and active states
- **Contacts Page**:
  - Made email addresses clickable (`mailto:` links)
  - Made phone numbers clickable (`tel:` links)
  - Added hover states for table rows
  - Added empty state handling
  - Added result count display
- **Security**: Moved hardcoded sync PIN from source code to environment variable (`SYNC_PIN`)
- **API Configuration**: Replaced hardcoded `http://localhost:3001/api` with configurable `VITE_API_BASE_URL`

### Removed
- **Unused Files**:
  - Deleted `Frontend/building-webapp/src/templateApp.jsx` (Vite boilerplate)
  - Deleted `backend/_ul` (orphaned file)
  - Deleted `nul` (Windows artifact)
- **Duplicate Building Components**:
  - Deleted `DHA.jsx`, `DHB.jsx`, `DHC.jsx`, `DHD.jsx`, `NS1.jsx`, `NS2.jsx`
  - Replaced with single `BuildingView.jsx` component (saved ~192 lines of duplicate code)
- **Getting Started Section**: Removed from Home page per user request

### Fixed
- **Assets Pagination**: Fixed cursor-based pagination to retrieve all assets (previously stopped at 100)
- **Asset Name Mapping**: Fixed field mapping to use `clientAssetId` instead of undefined `name` field
- **Routing**: Updated App.jsx to use BuildingView component with `:id` parameter

### Security Improvements
- Moved hardcoded PIN (`1725`) to environment variable in `.env` file
- Added `SYNC_PIN` to backend configuration with fallback
- Updated `assetsController.js` to use `config.syncPin` instead of hardcoded value

### Technical Debt Addressed
- **Code Duplication**: Reduced building page components from 7 files to 1 component + 1 config file
- **Configuration Management**: Centralized API URLs and environment-specific settings
- **Hardcoded Values**: Eliminated hardcoded backend URL and sync PIN from source code

### Documentation
- Created this CHANGELOG.md to track project changes
- Updated `.env.example` files for both backend and frontend
- Added inline comments for configuration files

## UI/UX Improvements Completed

### Home Page
- ✅ Added feature card grid with 6 main features (Issues, Assets, Buildings, Schedules, Contacts, Commissioning)
- ✅ Implemented hover effects with border color change (#0696D7)
- ✅ Created welcoming visual hierarchy with cards and proper spacing
- ✅ Removed "Getting Started" section per user request

### Schedules Page
- ✅ Added page title "Schedules" and description
- ✅ Wrapped FrameSelector and viewer in styled containers
- ✅ Set 6-Week PDF as default view

### Contacts Page
- ✅ Enhanced search filter with proper styling and labels
- ✅ Made emails clickable with mailto: links
- ✅ Made phone numbers clickable with tel: links
- ✅ Added hover states for table rows (#252525)
- ✅ Added empty state handling with text message
- ✅ Added result count display
- ✅ Improved table header styling (uppercase, better spacing)

### Issues Page
- ✅ Updated filter label colors to match Contacts page (#a0a0a0)
- ✅ Changed filter input backgrounds to white with dark text
- ✅ Standardized filter styling across all filter controls

### Assets Page
- ✅ Updated filter label colors to match Contacts page (#a0a0a0)
- ✅ Changed filter input backgrounds to white with dark text
- ✅ Standardized all search and dropdown styling

### Navigation
- ✅ Changed "Commis. Log" to "Commissioning"
- ✅ Increased font size from 16px to 32px (2x larger)
- ✅ Increased nav bar height from 50px to 70px
- ✅ Added hover effects (rgba(255, 255, 255, 0.05))
- ✅ Enhanced active state with #0696D7 background
- ✅ Improved overall styling and transitions

## Known Issues

### Pending UI/UX Improvements
See UI_IMPROVEMENTS_STATUS.md for full list of remaining UI/UX improvements needed.

### Technical Debt Remaining
- No test coverage (unit, integration, or E2E tests)
- No input validation middleware on API endpoints
- No structured logging system (console.log throughout)
- No database migration system
- No graceful shutdown handlers for database connections
- Session secret still has default fallback value

## Future Enhancements
- Add comprehensive test suite (Jest for backend, Testing Library for frontend)
- Implement input validation using express-validator or similar
- Add structured logging with Winston or Pino
- Create database migration system
- Add deployment documentation and production configuration
- Consider TypeScript migration for type safety
- Implement proper error handling middleware
- Add API rate limiting and security headers
