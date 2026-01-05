import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commissioningDbPath = path.join(__dirname, 'data/commissioning.db');
const assetsDbPath = path.join(__dirname, 'data/assets.db');

const commissioningDb = new Database(commissioningDbPath);
const assetsDb = new Database(assetsDbPath);

// Sample data
const locations = ['Ground > 1A1', 'Ground > 1A2', 'Ground > 1B1', 'Ground > 2A1', 'Second Floor > 2A2'];
const userInitials = ['AM', 'BC', 'JD', 'SK'];

const workSamples = [
  'Installed new control panel and tested all connections',
  'Completed wiring for zone A controllers',
  'Ran functional tests on HVAC dampers',
  'Commissioned lighting control system',
  'Tested emergency power systems',
  'Calibrated temperature sensors',
  'Verified interlock sequences',
  'Programmed BAS schedules',
  'Tested fire alarm integration'
];

const issuesSamples = [
  'Controller not responding to BAS commands',
  'Sensor reading out of range',
  'Wiring mislabeled in panel B',
  'Missing mounting hardware for actuator',
  'Network connectivity issues',
  'Firmware update required',
  'Valve stuck at 50% position'
];

const needsWantsSamples = [
  'Need ladder for ceiling access',
  'Request additional test equipment',
  'Need coordination with electrical contractor',
  'Want earlier access to mechanical room',
  'Need updated drawings for zone 3',
  'Request spare sensors for testing'
];

const delaysSamples = [
  'Waiting for equipment delivery',
  'Mechanical contractor still working in area',
  'Power not yet available',
  'Awaiting approval from engineer',
  'Weather delay for roof access',
  'Missing submittal approval'
];

// Get some sample assets
const sampleAssets = assetsDb.prepare(`
  SELECT id FROM assets WHERE excel_data = 'true' LIMIT 20
`).all();

const assetIds = sampleAssets.map(a => a.id);

// Generate dates for the past week
const today = new Date();
const dates = [];
for (let i = 6; i >= 0; i--) {
  const date = new Date(today);
  date.setDate(date.getDate() - i);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  dates.push(`${year}-${month}-${day}`);
}

// Helper function to get random items
function getRandom(arr, count = 1) {
  if (count === 1) return arr[Math.floor(Math.random() * arr.length)];
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomAssets() {
  const count = Math.floor(Math.random() * 3) + 1; // 1-3 assets
  return getRandom(assetIds, count);
}

// Create sample entries
console.log('Creating sample commissioning data...\n');

const insert = commissioningDb.prepare(`
  INSERT INTO commissioning_entries (
    location, assets, work_performed, issues, needs_wants, delays, initials, submitted_at, created_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let totalEntries = 0;

dates.forEach(date => {
  // Create 2-4 entries per day
  const entriesPerDay = Math.floor(Math.random() * 3) + 2;

  for (let i = 0; i < entriesPerDay; i++) {
    const location = getRandom(locations);
    const assets = getRandomAssets();
    const initials = getRandom(userInitials);

    // Randomly include different fields
    const workPerformed = Math.random() > 0.3 ? getRandom(workSamples) : null;
    const issues = Math.random() > 0.5 ? getRandom(issuesSamples) : null;
    const needsWants = Math.random() > 0.6 ? getRandom(needsWantsSamples) : null;
    const delays = Math.random() > 0.7 ? getRandom(delaysSamples) : null;

    // Random time during the day
    const hour = Math.floor(Math.random() * 10) + 8; // 8 AM to 6 PM
    const minute = Math.floor(Math.random() * 60);
    const submittedAt = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;

    insert.run(
      location,
      JSON.stringify(assets),
      workPerformed,
      issues,
      needsWants,
      delays,
      initials,
      submittedAt,
      date
    );

    totalEntries++;
    console.log(`Created entry ${totalEntries}: ${date} - ${location} - ${initials}`);
  }
});

console.log(`\n✅ Successfully created ${totalEntries} sample commissioning entries!`);
console.log(`Dates covered: ${dates[0]} to ${dates[dates.length - 1]}`);
console.log(`User initials: ${userInitials.join(', ')}`);

commissioningDb.close();
assetsDb.close();
