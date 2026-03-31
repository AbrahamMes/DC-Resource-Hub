/**
 * Multi-Site Migration Script
 *
 * Migrates the ACC Issue Display application from single-site to multi-site architecture.
 *
 * This script:
 * 1. Creates TTX directory structure
 * 2. Moves existing databases to TTX folder
 * 3. Moves Excel file to TTX folder
 * 4. Creates TXE directory structure with placeholders
 * 5. Creates backup of original files
 *
 * Usage: node backend/scripts/migrate-to-multisite.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, renameSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../data');
const backupDir = join(dataDir, '_backup_pre_multisite');

console.log('🚀 Starting multi-site migration...\n');

// Helper function to ensure directory exists
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  } else {
    console.log(`ℹ️  Directory already exists: ${dirPath}`);
  }
}

// Helper function to move file (with backup)
function moveFile(oldPath, newPath, shouldBackup = true) {
  if (!existsSync(oldPath)) {
    console.log(`⚠️  Source file not found: ${oldPath}`);
    return false;
  }

  if (existsSync(newPath)) {
    console.log(`ℹ️  Destination already exists: ${newPath}`);
    return false;
  }

  try {
    // Create backup if requested
    if (shouldBackup) {
      const backupPath = join(backupDir, dirname(oldPath).split(dataDir)[1] || '', basename(oldPath));
      ensureDir(dirname(backupPath));
      copyFileSync(oldPath, backupPath);
      console.log(`📦 Backed up: ${basename(oldPath)}`);
    }

    // Move file
    renameSync(oldPath, newPath);
    console.log(`✅ Moved: ${basename(oldPath)} → ${newPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error moving file: ${error.message}`);
    return false;
  }
}

// Helper to get basename
function basename(filePath) {
  return filePath.split(/[\\/]/).pop();
}

console.log('📋 Step 1: Creating backup directory...\n');
ensureDir(backupDir);

console.log('\n📋 Step 2: Creating TTX directory structure...\n');
ensureDir(join(dataDir, 'TTX'));
ensureDir(join(dataDir, 'TTX', 'buildings'));
ensureDir(join(dataDir, 'TTX', 'schedules'));

console.log('\n📋 Step 3: Moving existing databases to TTX folder...\n');
const dbFiles = [
  { old: join(dataDir, 'issues.db'), new: join(dataDir, 'TTX', 'issues.db') },
  { old: join(dataDir, 'assets.db'), new: join(dataDir, 'TTX', 'assets.db') },
  { old: join(dataDir, 'commissioning.db'), new: join(dataDir, 'TTX', 'commissioning.db') }
];

for (const { old: oldPath, new: newPath } of dbFiles) {
  moveFile(oldPath, newPath, true);
}

console.log('\n📋 Step 4: Moving Excel file to TTX folder...\n');
const excelFile = join(dataDir, 'Asset List_Rev10.xlsx');
const newExcelPath = join(dataDir, 'TTX', 'Asset List_Rev10.xlsx');
moveFile(excelFile, newExcelPath, true);

console.log('\n📋 Step 5: Creating TTX contacts.json (if needed)...\n');
const ttxContactsPath = join(dataDir, 'TTX', 'contacts.json');
if (!existsSync(ttxContactsPath)) {
  // Check if contacts.json exists in data root
  const oldContactsPath = join(dataDir, 'contacts.json');
  if (existsSync(oldContactsPath)) {
    moveFile(oldContactsPath, ttxContactsPath, true);
  } else {
    // Create placeholder
    const placeholderContacts = {
      contacts: [
        {
          name: "Example Contact",
          title: "Project Manager",
          email: "example@example.com",
          phone: "555-0100",
          area: "All",
          equipment: "General"
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    writeFileSync(ttxContactsPath, JSON.stringify(placeholderContacts, null, 2));
    console.log(`✅ Created placeholder: ${ttxContactsPath}`);
  }
}

console.log('\n📋 Step 6: Creating TXE directory structure...\n');
ensureDir(join(dataDir, 'TXE'));
ensureDir(join(dataDir, 'TXE', 'buildings'));
ensureDir(join(dataDir, 'TXE', 'schedules'));

console.log('\n📋 Step 7: Creating TXE placeholder files...\n');

// TXE contacts.json
const txeContactsPath = join(dataDir, 'TXE', 'contacts.json');
if (!existsSync(txeContactsPath)) {
  const placeholderContacts = {
    contacts: [
      {
        name: "TXE Contact Placeholder",
        title: "To Be Added",
        email: "tba@example.com",
        phone: "555-0000",
        area: "All",
        equipment: "General"
      }
    ],
    lastUpdated: new Date().toISOString(),
    note: "TODO: Add real contacts for El Paso site"
  };
  writeFileSync(txeContactsPath, JSON.stringify(placeholderContacts, null, 2));
  console.log(`✅ Created: ${txeContactsPath}`);
}

// TXE placeholder README
const txeReadmePath = join(dataDir, 'TXE', 'README.md');
if (!existsSync(txeReadmePath)) {
  const readmeContent = `# TXE (El Paso, TX) Data Directory

This directory contains site-specific data for the El Paso data center.

## TODO Items

### Required Files
- [ ] **Asset List Excel File**: Upload asset list for filtering (\`Asset_List_Placeholder.xlsx\`)
- [ ] **Building Images**: Add building and room layout images to \`buildings/\` folder
- [ ] **Schedule Images/PDFs**: Add schedule files to \`schedules/\` folder
- [ ] **Contacts**: Update \`contacts.json\` with real El Paso contacts

### Configuration
- [ ] **ACC_ASSIGNED_TO_ID**: Add assigned user ID when Prime Controls is assigned issues in ACC

## Directory Structure

\`\`\`
TXE/
  ├── issues.db               (auto-created on first sync)
  ├── assets.db               (auto-created on first sync)
  ├── commissioning.db        (auto-created on first entry)
  ├── contacts.json           (placeholder - update with real contacts)
  ├── Asset_List_Placeholder.xlsx  (TODO: upload real file)
  ├── buildings/              (TODO: add building/room images)
  └── schedules/              (TODO: add schedule images/PDFs)
\`\`\`

## Adding Building Images

1. Name images following pattern: \`[BuildingID]_[RoomID].jpg\`
   - Example: \`TXE1_DHA.jpg\`, \`TXE1_DHB.jpg\`
2. Update room configuration in \`backend/src/config/sites.js\`
3. Images should be floor plans or layout drawings

## Notes

- Databases are created automatically when first accessed
- Make sure to update \`backend/src/config/sites.js\` with room structure
- Test thoroughly before deploying to production
`;
  writeFileSync(txeReadmePath, readmeContent);
  console.log(`✅ Created: ${txeReadmePath}`);
}

console.log('\n📋 Step 8: Creating summary file...\n');
const summaryPath = join(dataDir, 'MIGRATION_SUMMARY.txt');
const summaryContent = `Multi-Site Migration Complete
=============================
Date: ${new Date().toISOString()}

Directories Created:
- data/TTX/
- data/TTX/buildings/
- data/TTX/schedules/
- data/TXE/
- data/TXE/buildings/
- data/TXE/schedules/

Files Moved to TTX:
- issues.db → TTX/issues.db
- assets.db → TTX/assets.db
- commissioning.db → TTX/commissioning.db
- Asset List_Rev10.xlsx → TTX/Asset List_Rev10.xlsx
- contacts.json → TTX/contacts.json (if existed)

Placeholder Files Created:
- TXE/contacts.json
- TXE/README.md

Backup Location:
- data/_backup_pre_multisite/

Next Steps:
===========

1. MANUAL: Move building images from Frontend to backend
   - Source: Frontend/building-webapp/src/assets/*.jpg
   - Destination: backend/data/TTX/buildings/
   - Update image references in frontend to use backend API

2. OPTIONAL: Update .env file
   - Remove ACC_PROJECT_ID (now in sites.js)
   - Remove ACC_ASSIGNED_TO_ID (now in sites.js)

3. TEST: Restart backend server
   - cd backend && npm run dev
   - Verify TTX site works with existing data
   - Verify TXE site loads with placeholders

4. FUTURE: Add TXE data
   - Upload asset list Excel file
   - Add building images
   - Update contacts.json
   - Add ACC_ASSIGNED_TO_ID when available

Rollback Instructions:
=====================
If migration fails, restore from backup:
1. Stop the backend server
2. Copy files from data/_backup_pre_multisite/ back to data/
3. Delete TTX/ and TXE/ folders
4. Restart server

For support, see: docs/ADD_NEW_SITE.md (to be created)
`;

writeFileSync(summaryPath, summaryContent);
console.log(`✅ Created: ${summaryPath}`);

console.log('\n✨ Migration complete!\n');
console.log('📄 See data/MIGRATION_SUMMARY.txt for next steps');
console.log('📦 Original files backed up to: data/_backup_pre_multisite/\n');
console.log('⚠️  IMPORTANT: You must manually move building images from Frontend to backend!');
console.log('   Source: Frontend/building-webapp/src/assets/*.jpg');
console.log('   Destination: backend/data/TTX/buildings/\n');
