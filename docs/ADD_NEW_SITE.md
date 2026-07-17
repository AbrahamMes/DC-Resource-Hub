# Adding a New Site to ACC Issue Display

This guide walks you through adding a new data center site to the ACC Issue Display application.

## Prerequisites

Before adding a new site, gather the following information:

1. **Site Information**:
   - Site ID (3-4 letter uppercase code, e.g., 'DFW', 'CHI', 'NYC')
   - Site short name (e.g., 'Dallas, TX')
   - Site full name (e.g., 'Dallas Data Center')

2. **Autodesk ACC Information**:
   - ACC Project ID (UUID from Autodesk Construction Cloud)
   - ACC Assigned To ID (User ID for filtering issues)
   - Note: Get these from the ACC project URL or API

3. **Building Structure**:
   - List of buildings at the site (e.g., 'DFW1', 'DFW2')
   - For each building: list of rooms/areas with their:
     - Room ID (lowercase, e.g., 'dha', 'mep')
     - Room name (e.g., 'DHA', 'MEP Room')
     - Full room name (optional, e.g., 'Data Hall A')
     - Floor plan image filename (optional, e.g., 'DFW1_DHA.jpg')

4. **Asset Data** (optional):
   - Excel file with asset list
   - Format should match existing: `Asset List_RevXX.xlsx`

5. **Contact Data** (optional):
   - JSON file with contacts list
   - Format should match existing: `contacts.json`

## Step 1: Update Site Configuration

Edit `backend/src/config/sites.js` and add your new site to the `sites` object:

```javascript
const sites = {
  TTX: { /* existing TTX config */ },
  TXE: { /* existing TXE config */ },

  // Add your new site here:
  DFW: {
    id: 'DFW',
    name: 'Dallas, TX',
    fullName: 'Dallas Data Center',

    // Get these from your ACC project
    accProjectId: 'your-project-uuid-here',
    accAssignedToId: 'your-assigned-to-id-here',

    // Database paths (will be auto-created)
    databases: {
      issues: 'DFW/issues.db',
      assets: 'DFW/assets.db',
      commissioning: 'DFW/commissioning.db'
    },

    // Static asset paths
    staticAssets: {
      excelFile: 'DFW/Asset List_Rev01.xlsx',        // Optional
      contacts: 'DFW/contacts.json',                  // Optional
      buildingsDir: 'DFW/buildings/'                  // For floor plan images
    },

    // Building hierarchy
    buildings: [
      {
        id: 'dfw1',
        name: 'DFW1',
        description: 'Primary data center building',
        rooms: [
          {
            id: 'dha',
            name: 'DHA',
            fullName: 'Data Hall A',
            images: {
              default: 'DFW1_DHA.jpg'  // Must exist in staticAssets.buildingsDir
            }
          },
          {
            id: 'mep',
            name: 'MEP Room',
            fullName: 'Mechanical Electrical Plumbing Room',
            images: {
              default: 'DFW1_MEP.jpg'
            }
          }
          // Add more rooms...
        ]
      }
      // Add more buildings...
    ]
  }
};
```

**Important Notes**:
- Site IDs should be UPPERCASE (e.g., 'DFW', not 'dfw')
- Building IDs should be lowercase (e.g., 'dfw1', not 'DFW1')
- Room IDs should be lowercase (e.g., 'dha', not 'DHA')
- Use consistent naming conventions

## Step 2: Create Directory Structure

Create the data directory for your new site:

```bash
cd backend/data
mkdir DFW
mkdir DFW/buildings
```

The database files (`issues.db`, `assets.db`, `commissioning.db`) will be created automatically when first accessed.

## Step 3: Add Static Files (Optional)

### Building Floor Plan Images

If you have floor plan images, add them to the buildings directory:

```bash
# Copy your floor plan images
cp path/to/DFW1_DHA.jpg backend/data/DFW/buildings/
cp path/to/DFW1_MEP.jpg backend/data/DFW/buildings/
```

**Image Requirements**:
- Format: JPG, PNG, or other web-compatible formats
- Recommended size: 1920x1080 or higher
- Keep file sizes reasonable (< 5MB per image)
- Filenames must match those in `sites.js` config

**No Image Placeholder**: If no image exists, the RoomView page will show a placeholder with instructions.

### Asset Excel File

If you have an asset list Excel file:

```bash
cp "path/to/Asset List_Rev01.xlsx" backend/data/DFW/
```

**Excel File Format**:
- Must have a sheet with columns matching existing format
- Typically includes: Asset Name, Category, Location, etc.
- Used for filtering assets during sync

### Contacts JSON File

If you have a contacts list:

```bash
cp path/to/contacts.json backend/data/DFW/
```

**JSON Format**:
```json
[
  {
    "name": "John Doe",
    "role": "Project Manager",
    "email": "john.doe@example.com",
    "phone": "(555) 123-4567",
    "area": "DHA",
    "equipment": "All"
  }
]
```

## Step 4: Verify Configuration

Check that your configuration is valid:

```bash
cd backend
node -e "
  import('./src/config/sites.js').then(({ getSiteConfig }) => {
    try {
      const site = getSiteConfig('DFW');
      console.log('✅ Site configuration valid:');
      console.log(JSON.stringify(site, null, 2));
    } catch (err) {
      console.error('❌ Configuration error:', err.message);
    }
  });
"
```

## Step 5: Restart Backend Server

Restart the backend server to load the new configuration:

```bash
cd backend
npm run dev
```

The server should start without errors and show:
```
🚀 ACC Issues Backend (Multi-Site) running on http://localhost:3001
🌐 Multi-site support enabled
📍 Available sites: Check /api/sites
```

## Step 6: Verify Site Appears

Test that your new site appears in the API:

```bash
# Check all sites
curl http://localhost:3001/api/sites

# Check specific site
curl http://localhost:3001/api/sites/DFW
```

You should see your new site in the response:
```json
{
  "success": true,
  "sites": [
    { "id": "TTX", "name": "Temple, TX", "fullName": "Temple Data Center" },
    { "id": "TXE", "name": "El Paso, TX", "fullName": "El Paso Data Center" },
    { "id": "DFW", "name": "Dallas, TX", "fullName": "Dallas Data Center" }
  ]
}
```

## Step 7: Test in Frontend

1. Open the frontend application: `http://localhost:5173`
2. Click the site selector dropdown in the navigation bar
3. Your new site should appear in the list
4. Select your site
5. Navigate to different pages to ensure they work:
   - Home page should load
   - Buildings page should show your configured buildings
   - Clicking a building should show rooms
   - Clicking a room should show floor plan (or placeholder)

## Step 8: Sync Data (Optional)

If you have ACC credentials configured, you can sync data for the new site:

### Issues Sync
1. Go to Issues page
2. Click "Login with Autodesk" (if not already logged in)
3. Click "Sync with ACC"
4. Issues will be fetched from the ACC project

### Assets Sync
1. Go to Assets page
2. Click "Login with Autodesk" (if not already logged in)
3. Enter the sync PIN configured in the backend environment.
4. Click "Re-query ACC API"
5. Assets will be synced with progress display

## Troubleshooting

### Site Doesn't Appear in Dropdown

**Problem**: New site not showing in site selector

**Solutions**:
1. Check that you restarted the backend server
2. Clear browser cache and localStorage: `localStorage.clear()` in console
3. Check browser console for errors
4. Verify `sites.js` has valid JavaScript syntax

### "Invalid site" Error

**Problem**: API returns 400 error with "Invalid site" message

**Solutions**:
1. Verify site ID is UPPERCASE in `sites.js`
2. Check that site ID matches exactly in all places
3. Restart backend server
4. Check backend logs for more details

### Building Images Not Displaying

**Problem**: Floor plan images show placeholder instead of image

**Solutions**:
1. Check image file exists: `backend/data/{SITE_ID}/buildings/{IMAGE_NAME}.jpg`
2. Verify filename in `sites.js` matches actual file
3. Check file permissions (should be readable)
4. Check browser console for 404 errors
5. Verify static file route is working: `http://localhost:3001/api/static/{SITE_ID}/building/{IMAGE_NAME}.jpg`

### Database Errors

**Problem**: Errors about database files or tables

**Solutions**:
1. Database files are created automatically on first access
2. Check directory permissions: `backend/data/{SITE_ID}/` must be writable
3. Delete and recreate database files if corrupted
4. Check backend logs for specific SQL errors

### ACC Sync Not Working

**Problem**: Sync fails or returns no data

**Solutions**:
1. Verify ACC Project ID is correct (check ACC project URL)
2. Verify ACC Assigned To ID is correct
3. Check that OAuth credentials are valid
4. Verify you have access to the ACC project
5. Check backend logs for API error responses

## Data Migration from Existing Site

If you're copying data from an existing site:

```bash
# Example: Copy TTX data to new DFW site
cd backend/data

# Copy databases
cp TTX/issues.db DFW/issues.db
cp TTX/assets.db DFW/assets.db
cp TTX/commissioning.db DFW/commissioning.db

# Copy Excel and contacts
cp "TTX/Asset List_Rev10.xlsx" "DFW/Asset List_Rev01.xlsx"
cp TTX/contacts.json DFW/contacts.json

# Copy building images
cp TTX/buildings/* DFW/buildings/
```

**Warning**: This copies the actual data. If you just want the structure, it's better to let the databases be created fresh and sync from ACC.

## Rolling Back

If you need to remove a site:

1. **Remove from Configuration**:
   - Edit `backend/src/config/sites.js`
   - Remove the site entry
   - Save the file

2. **Restart Backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Clear Frontend State** (optional):
   - If users had this site selected, they may see errors
   - Ask them to clear localStorage or select a different site

4. **Remove Data** (optional):
   ```bash
   # Backup first!
   cd backend/data
   mv DFW DFW_backup_$(date +%Y%m%d)
   ```

## Best Practices

1. **Test with Placeholder Data First**:
   - Add site configuration without ACC IDs initially
   - Use placeholder ACC IDs: `'PLACEHOLDER_PROJECT_ID'`
   - Test that site appears and pages load
   - Add real ACC IDs once structure is confirmed

2. **Version Control**:
   - Commit `sites.js` changes to git
   - Do NOT commit database files or Excel files to git
   - Add `.gitignore` entries for `backend/data/*/` if needed

3. **Documentation**:
   - Document site-specific quirks in CLAUDE.md
   - Keep track of ACC Project IDs in secure location
   - Document building/room structure for future reference

4. **Backup Before Changes**:
   - Always backup `sites.js` before editing
   - Backup existing site data before modifications
   - Test in development before deploying to production

5. **Naming Conventions**:
   - Site IDs: 3-4 letter airport-style codes (DFW, ORD, LAX)
   - Building IDs: Lowercase site + number (dfw1, dfw2)
   - Room IDs: Lowercase abbreviations (dha, mep, ups)
   - Image files: {BUILDING}_{ROOM}.jpg (DFW1_DHA.jpg)

## Example: Complete Site Addition

Here's a complete example of adding the Dallas (DFW) site:

```javascript
// 1. Add to sites.js
DFW: {
  id: 'DFW',
  name: 'Dallas, TX',
  fullName: 'Dallas Data Center',
  accProjectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  accAssignedToId: '123456789',
  databases: {
    issues: 'DFW/issues.db',
    assets: 'DFW/assets.db',
    commissioning: 'DFW/commissioning.db'
  },
  staticAssets: {
    excelFile: 'DFW/Asset List_Rev01.xlsx',
    contacts: 'DFW/contacts.json',
    buildingsDir: 'DFW/buildings/'
  },
  buildings: [
    {
      id: 'dfw1',
      name: 'DFW1',
      description: 'Primary data center',
      rooms: [
        { id: 'dha', name: 'DHA', fullName: 'Data Hall A', images: { default: 'DFW1_DHA.jpg' } },
        { id: 'dhb', name: 'DHB', fullName: 'Data Hall B', images: { default: 'DFW1_DHB.jpg' } },
        { id: 'mep', name: 'MEP', fullName: 'MEP Room', images: { default: 'DFW1_MEP.jpg' } }
      ]
    },
    {
      id: 'dfw2',
      name: 'DFW2',
      description: 'Secondary data center',
      rooms: [
        { id: 'dha', name: 'DHA', fullName: 'Data Hall A', images: { default: 'DFW2_DHA.jpg' } }
      ]
    }
  ]
}
```

```bash
# 2. Create directories
mkdir -p backend/data/DFW/buildings

# 3. Add files (if available)
cp images/DFW1_DHA.jpg backend/data/DFW/buildings/
cp images/DFW1_DHB.jpg backend/data/DFW/buildings/
cp images/DFW1_MEP.jpg backend/data/DFW/buildings/
cp images/DFW2_DHA.jpg backend/data/DFW/buildings/
cp "Asset List.xlsx" "backend/data/DFW/Asset List_Rev01.xlsx"

# 4. Restart server
cd backend && npm run dev

# 5. Test
curl http://localhost:3001/api/sites/DFW
```

## Support

If you encounter issues not covered in this guide:

1. Check backend console logs for detailed error messages
2. Check browser console for frontend errors
3. Review CLAUDE.md for architecture details
4. Check existing site configurations for examples
5. Verify all file paths and IDs match exactly

## Quick Reference

**Required Steps**:
1. Edit `backend/src/config/sites.js` - Add site config
2. Create `backend/data/{SITE_ID}/` directory
3. Create `backend/data/{SITE_ID}/buildings/` directory
4. Restart backend server
5. Test in frontend

**Optional Steps**:
- Add floor plan images to buildings directory
- Add Excel asset list file
- Add contacts JSON file
- Sync data from ACC

**Testing Checklist**:
- [ ] Site appears in dropdown
- [ ] Site selection persists after refresh
- [ ] Buildings page shows configured buildings
- [ ] Building detail pages load
- [ ] Room detail pages load
- [ ] Floor plan images display (or show placeholder)
- [ ] Issues sync works (if ACC configured)
- [ ] Assets sync works (if ACC configured)
- [ ] Commissioning form works
- [ ] Data is isolated from other sites
