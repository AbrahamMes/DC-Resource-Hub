# Asset Location Mapping System

This guide explains how to configure asset location mapping to display assets on room floor plans with interactive markers.

## Overview

The location mapping system allows you to:
- Map ACC asset location strings to specific rooms in your buildings
- Display assets as clickable markers on floor plan images
- Show asset details in a side panel
- Search and filter assets by room

## Architecture

The system consists of three main components:

1. **Location Mapping File** (`backend/data/{SITE_ID}/location_mapping.json`) - Maps ACC locations to building/room IDs
2. **Marker Configuration** (`backend/src/config/sites.js`) - Defines marker positions on floor plans
3. **Frontend Display** (`RoomView.jsx`) - Displays markers and asset list

## Step 1: Configure Location Mapping

Each site has a `location_mapping.json` file that maps ACC location strings to building and room IDs.

### Location: `backend/data/{SITE_ID}/location_mapping.json`

```json
{
  "mappings": [
    {
      "accLocation": "DCB1 > AREA A > Ground > 1A1",
      "buildingId": "ttx1",
      "roomId": "dha",
      "notes": "DCB1 = TTX1, 1A1 = Data Hall A"
    }
  ],
  "patterns": [
    {
      "pattern": "^DCB1 > AREA A > Ground > 1A\\d+$",
      "buildingId": "ttx1",
      "roomId": "dha",
      "notes": "Matches all 1A zones in TTX1 Data Hall A"
    }
  ]
}
```

### Fields:

- **mappings** (array): Exact location string matches
  - `accLocation`: Exact ACC location string (e.g., "DCB1 > AREA A > Ground > 1A1")
  - `buildingId`: Building ID from sites.js (e.g., "ttx1")
  - `roomId`: Room ID from sites.js (e.g., "dha")
  - `notes`: Optional human-readable notes

- **patterns** (array): Regex pattern matches (more flexible)
  - `pattern`: Regular expression to match location strings
  - `buildingId`: Building ID to map to
  - `roomId`: Room ID to map to
  - `notes`: Optional notes

### Mapping Strategy:

1. **Use exact mappings** for specific known locations
2. **Use patterns** for matching multiple similar locations (e.g., all zones in an area)
3. The system tries exact matches first, then pattern matches

### Example: Understanding ACC Location Format

ACC assets typically have locations like:
```
DCB1 > AREA A > Ground > 1A1
DCB1 > AREA A > Ground > 1A2
DCB1 > AREA A > Mezzanine > Ground-1A
DCB2 > AREA B > Ground > 2B1
```

Breaking down the structure:
- **Building** (DCB1, DCB2) - Maps to your building IDs (ttx1, ttx2, etc.)
- **Area** (AREA A, AREA B) - May correspond to different wings/sections
- **Floor** (Ground, Mezzanine, Roof) - Physical floor level
- **Zone** (1A1, 1A2, 2B1) - Specific location within the room

## Step 2: Add Marker Positions to Floor Plans

Once you know which assets belong to which rooms, configure markers on the floor plan.

### Location: `backend/src/config/sites.js`

Add a `markers` array to any room configuration:

```javascript
{
  id: 'dha',
  name: 'DHA',
  fullName: 'Data Hall A',
  images: {
    default: 'TTX1_DHA.jpg'
  },
  markers: [
    {
      id: 'zone-1a1',       // Unique marker ID
      x: 0.25,              // X position (0.0 to 1.0, left to right)
      y: 0.35,              // Y position (0.0 to 1.0, top to bottom)
      zone: '1A1',          // Zone identifier to match assets
      label: 'Zone 1A1',    // Tooltip label
      alwaysShow: false     // Show even if no assets found
    },
    {
      id: 'zone-1a2',
      x: 0.75,
      y: 0.35,
      zone: '1A2',
      label: 'Zone 1A2',
      alwaysShow: false
    }
  ]
}
```

### Marker Fields:

- **id** (required): Unique identifier for the marker
- **x** (required): Horizontal position as decimal (0.0 = left edge, 1.0 = right edge)
- **y** (required): Vertical position as decimal (0.0 = top edge, 1.0 = bottom edge)
- **zone** (required): Zone identifier to match against asset locations
- **label** (optional): Tooltip text shown on hover
- **alwaysShow** (optional): If true, shows marker even when no assets match

### How Markers Work:

1. The system finds all assets for the room using location_mapping.json
2. For each marker, it filters assets where `asset.location` contains the marker's `zone`
3. If assets are found, displays a square marker showing the count
4. Clicking the marker selects the first asset in that zone
5. The marker shows the number of assets in that zone

### Positioning Markers:

To find the correct X/Y coordinates for your markers:

1. Open the floor plan image in an image editor
2. Note the pixel position where you want the marker
3. Calculate: `x = pixel_x / image_width`, `y = pixel_y / image_height`

**Example:**
- Image dimensions: 1920x1080
- Desired marker position: 480px, 378px
- Calculated: x = 480/1920 = 0.25, y = 378/1080 = 0.35

## Step 3: Test the Configuration

1. Restart the backend server:
```bash
cd backend
npm run dev
```

2. Navigate to a room with configured markers:
```
http://localhost:5173/buildings/ttx1/rooms/dha
```

3. Verify:
   - Asset count appears in the page header
   - Square markers appear on the floor plan with numbers
   - Markers are positioned correctly
   - Clicking a marker selects the asset
   - Right sidebar shows the asset list
   - Search works in the sidebar

## Step 4: Troubleshooting

### No Assets Showing

**Problem**: Room shows "No assets in this room"

**Solutions**:
1. Check location_mapping.json has mappings for this room
2. Verify buildingId and roomId match sites.js exactly (case-sensitive)
3. Check assets have location data:
   ```bash
   # In backend directory
   node -e "import('better-sqlite3').then(({ default: Database }) => { const db = new Database('./data/TTX/assets.db'); const assets = db.prepare(\"SELECT name, location FROM assets WHERE location != '' LIMIT 10\").all(); console.log(assets); })"
   ```

### Assets Show But No Markers

**Problem**: Assets appear in sidebar but no markers on floor plan

**Solutions**:
1. Add `markers` array to room config in sites.js
2. Verify marker `zone` matches parts of asset locations
3. Check `alwaysShow: true` on one marker to verify positioning works

### Markers in Wrong Position

**Problem**: Markers appear but in the wrong place

**Solutions**:
1. Recalculate x/y coordinates (they should be 0.0 to 1.0)
2. Remember: x=0 is left, x=1 is right, y=0 is top, y=1 is bottom
3. Try starting with x=0.5, y=0.5 (center) and adjust from there

### Pattern Not Matching

**Problem**: Regex pattern doesn't match expected locations

**Solutions**:
1. Test your regex at regex101.com with sample ACC locations
2. Remember to escape special characters: `\d` for digits, `\.` for dots
3. Use `^` at start and `$` at end for exact matching
4. Common pattern examples:
   - `^DCB1.*1A\\d+$` - Matches DCB1 with 1A followed by digits
   - `^.*Ground > 1A.*$` - Matches any location with "Ground > 1A"

## Example: Complete Setup for TTX Site

### 1. Create location_mapping.json

```json
{
  "mappings": [
    {
      "accLocation": "DCB1 > AREA A > Ground > 1A1",
      "buildingId": "ttx1",
      "roomId": "dha"
    },
    {
      "accLocation": "DCB1 > AREA A > Ground > 1A2",
      "buildingId": "ttx1",
      "roomId": "dha"
    },
    {
      "accLocation": "DCB1 > AREA A > Ground > 1B1",
      "buildingId": "ttx1",
      "roomId": "dhb"
    }
  ],
  "patterns": [
    {
      "pattern": "^DCB1 > AREA A > Ground > 1A\\d+$",
      "buildingId": "ttx1",
      "roomId": "dha"
    },
    {
      "pattern": "^DCB1 > AREA A > Ground > 1B\\d+$",
      "buildingId": "ttx1",
      "roomId": "dhb"
    }
  ]
}
```

### 2. Add markers to sites.js

```javascript
TTX: {
  buildings: [
    {
      id: 'ttx1',
      name: 'TTX1',
      rooms: [
        {
          id: 'dha',
          name: 'DHA',
          fullName: 'Data Hall A',
          images: { default: 'TTX1_DHA.jpg' },
          markers: [
            { id: 'zone-1a1', x: 0.25, y: 0.5, zone: '1A1', label: 'Zone 1A1' },
            { id: 'zone-1a2', x: 0.75, y: 0.5, zone: '1A2', label: 'Zone 1A2' }
          ]
        },
        {
          id: 'dhb',
          name: 'DHB',
          fullName: 'Data Hall B',
          images: { default: 'TTX1_DHB.jpg' },
          markers: [
            { id: 'zone-1b1', x: 0.5, y: 0.5, zone: '1B1', label: 'Zone 1B1' }
          ]
        }
      ]
    }
  ]
}
```

### 3. Restart and test

```bash
cd backend && npm run dev
# In another terminal:
cd Frontend/building-webapp && npm run dev
# Visit: http://localhost:5173/buildings/ttx1/rooms/dha
```

## Advanced Configuration

### Multiple Markers for Same Zone

You can have multiple markers pointing to the same zone:

```javascript
markers: [
  { id: 'rack-1a1-north', x: 0.25, y: 0.3, zone: '1A1', label: 'North Racks' },
  { id: 'rack-1a1-south', x: 0.25, y: 0.7, zone: '1A1', label: 'South Racks' }
]
```

### Conditional Display

Use `alwaysShow: true` for important zones that should show even without assets:

```javascript
markers: [
  {
    id: 'ups-zone',
    x: 0.5,
    y: 0.5,
    zone: 'UPS',
    label: 'UPS Equipment',
    alwaysShow: true  // Shows even if no UPS assets found
  }
]
```

### Complex Location Patterns

For complex ACC location structures, use more specific patterns:

```javascript
{
  "pattern": "^DCB1 > AREA A > (Ground|Mezzanine) > 1A[12]$",
  "buildingId": "ttx1",
  "roomId": "dha",
  "notes": "Matches 1A1 and 1A2 on Ground or Mezzanine floors"
}
```

## Updating Location Mappings

After editing location_mapping.json:
- No restart needed for the mapping file itself
- The file is read on each API request
- Clear browser cache if assets don't update immediately

After editing sites.js markers:
- Backend server must be restarted
- Frontend will pick up changes automatically

## Best Practices

1. **Start Simple**: Begin with exact mappings, add patterns later if needed
2. **Test Incrementally**: Add a few mappings at a time and test
3. **Document Zones**: Use the notes field to document your mapping logic
4. **Version Control**: Commit location_mapping.json to git for tracking changes
5. **Coordinate System**: Keep a reference document showing marker coordinates
6. **Zone Naming**: Use consistent zone naming between ACC and your markers

## API Endpoints

The location mapping system adds these API endpoints:

### GET `/api/sites/:siteId/buildings/:buildingId/rooms/:roomId/assets`

Returns all assets mapped to a specific room.

**Example:**
```bash
curl http://localhost:3001/api/sites/TTX/buildings/ttx1/rooms/dha/assets
```

**Response:**
```json
{
  "success": true,
  "count": 125,
  "assets": [
    {
      "id": "...",
      "name": "1IWM.ICP.01",
      "location": "DCB1 > AREA A > Ground > 1A1",
      "category": "CONTROLS > BMS Control Panel",
      "manufacturer": "...",
      "model_number": "..."
    }
  ]
}
```

## File Structure

```
backend/
  data/
    TTX/
      location_mapping.json       # Maps ACC locations to rooms
      buildings/
        TTX1_DHA.jpg             # Floor plan image
    TXE/
      location_mapping.json
  src/
    config/
      sites.js                   # Marker positions
    utils/
      locationMapper.js          # Mapping logic
    routes/
      sites.js                   # Assets by room endpoint

Frontend/
  building-webapp/
    src/
      pages/
        RoomView.jsx             # Displays markers and assets
      components/
        viewer/
          ImageViewer.jsx        # Renders markers on image
```

## Support

For issues with location mapping:

1. Check backend console logs for mapping errors
2. Verify JSON syntax in location_mapping.json
3. Test regex patterns at regex101.com
4. Check browser console for API errors
5. Verify asset data has location field populated

## See Also

- [ADD_NEW_SITE.md](./ADD_NEW_SITE.md) - Adding new sites
- [CLAUDE.md](../CLAUDE.md) - Project overview
- Backend API documentation at http://localhost:3001/health
