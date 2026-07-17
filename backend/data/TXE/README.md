# TXE (El Paso, TX) Data Directory

This directory contains site-specific data for the El Paso data center.

## TODO Items

### Required Files
- [ ] **Asset List Excel File**: Upload asset list for filtering (`Asset_List_Placeholder.xlsx`)
- [ ] **Building Images**: Add building and room layout images to `buildings/` folder
- [ ] **Schedule Images/PDFs**: Add schedule files to `schedules/` folder
- [ ] **Contacts**: Update `contacts.json` with real El Paso contacts

### Configuration
- [ ] **ACC_ASSIGNED_TO_ID**: Add assigned user ID when Prime Controls is assigned issues in ACC

## Directory Structure

```
TXE/
  ├── issues.db               (auto-created on first sync)
  ├── assets.db               (auto-created on first sync)
  ├── commissioning.db        (auto-created on first entry)
  ├── contacts.json           (placeholder - update with real contacts)
  ├── Asset_List_Placeholder.xlsx  (TODO: upload real file)
  ├── buildings/              (TODO: add building/room images)
  └── schedules/              (TODO: add schedule images/PDFs)
```

## Adding Building Images

1. Name images following pattern: `[BuildingID]_[RoomID].jpg`
   - Example: `TXE1_DHA.jpg`, `TXE1_DHB.jpg`
2. Update room configuration in `backend/src/config/sites.js`
3. Images should be floor plans or layout drawings

## Notes

- Databases are created automatically when first accessed
- Make sure to update `backend/src/config/sites.js` with room structure
- Test thoroughly before deploying to production
