import Database from 'better-sqlite3';
import { resolveDataPath } from '../utils/storagePaths.js';

// Initialize SQLite database for commissioning reports
const dbPath = resolveDataPath('commissioning.db', 'Legacy commissioning database path');
const commissioningDb = new Database(dbPath);

// Create commissioning_entries table
commissioningDb.exec(`
  CREATE TABLE IF NOT EXISTS commissioning_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    assets TEXT,
    work_performed TEXT,
    issues TEXT,
    needs_wants TEXT,
    delays TEXT,
    initials TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    created_date TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_commissioning_location ON commissioning_entries(location);
  CREATE INDEX IF NOT EXISTS idx_commissioning_date ON commissioning_entries(created_date);
  CREATE INDEX IF NOT EXISTS idx_commissioning_submitted_at ON commissioning_entries(submitted_at);
`);

// Add work_performed column if it doesn't exist (for existing databases)
try {
  commissioningDb.exec(`ALTER TABLE commissioning_entries ADD COLUMN work_performed TEXT;`);
  console.log('✅ Added work_performed column to commissioning_entries table');
} catch (error) {
  // Column already exists, ignore error
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding work_performed column:', error);
  }
}

console.log('✅ Commissioning database initialized');

export default commissioningDb;
