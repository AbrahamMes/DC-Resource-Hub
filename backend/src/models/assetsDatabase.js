import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database for assets
const dbPath = path.join(__dirname, '../../data/assets.db');
const assetsDb = new Database(dbPath);

// Create assets table if it doesn't exist
assetsDb.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
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
    synced_at TEXT NOT NULL,
    raw_data TEXT,
    excel_data TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_asset_name ON assets(name);
  CREATE INDEX IF NOT EXISTS idx_asset_category ON assets(category);
  CREATE INDEX IF NOT EXISTS idx_asset_status ON assets(status);
  CREATE INDEX IF NOT EXISTS idx_asset_location ON assets(location);
`);

console.log('✅ Assets database initialized');

export default assetsDb;
