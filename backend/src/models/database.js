import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const dbPath = path.join(__dirname, '../../data/issues.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    display_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    priority TEXT,
    assigned_to TEXT,
    assigned_to_id TEXT,
    created_at TEXT,
    updated_at TEXT,
    due_date TEXT,
    issue_type TEXT,
    root_cause TEXT,
    location_description TEXT,
    owner TEXT,
    owner_id TEXT,
    created_by TEXT,
    created_by_id TEXT,
    container_id TEXT,
    synced_at TEXT NOT NULL,
    raw_data TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_assigned_to_id ON issues(assigned_to_id);
  CREATE INDEX IF NOT EXISTS idx_status ON issues(status);
  CREATE INDEX IF NOT EXISTS idx_created_at ON issues(created_at);
`);

// Add display_id column if it doesn't exist (migration for existing databases)
try {
  db.exec(`ALTER TABLE issues ADD COLUMN display_id INTEGER;`);
  console.log('✅ Added display_id column to existing issues table');
} catch (err) {
  // Column already exists, ignore error
  if (!err.message.includes('duplicate column name')) {
    console.error('Error adding display_id column:', err.message);
  }
}

// Create index on display_id after ensuring column exists
db.exec(`CREATE INDEX IF NOT EXISTS idx_display_id ON issues(display_id);`);

export default db;
