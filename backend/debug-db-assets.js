import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data/assets.db');

const db = new Database(dbPath);

// Get a few assets to inspect
const assets = db.prepare(`
  SELECT id, name, category, description, location, status, barcode,
         manufacturer, model_number, raw_data
  FROM assets
  WHERE excel_data = 'true'
  LIMIT 3
`).all();

console.log(`Found ${assets.length} assets in database\n`);

assets.forEach((asset, i) => {
  console.log(`\n=== Asset ${i + 1} ===`);
  console.log('ID:', asset.id);
  console.log('Name:', asset.name);
  console.log('Category:', asset.category);
  console.log('Location:', asset.location);
  console.log('Status:', asset.status);
  console.log('Manufacturer:', asset.manufacturer);
  console.log('Model Number:', asset.model_number);
  console.log('Barcode:', asset.barcode);

  if (asset.raw_data) {
    try {
      const rawData = JSON.parse(asset.raw_data);
      console.log('\nRaw Data Keys:', Object.keys(rawData));
      console.log('\nFull Raw Data:');
      console.log(JSON.stringify(rawData, null, 2));
    } catch (e) {
      console.log('Could not parse raw_data');
    }
  }
});

db.close();
