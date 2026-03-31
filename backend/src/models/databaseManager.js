/**
 * Site-Aware Database Manager
 *
 * Manages database connections for multiple sites with connection caching.
 * Each site has its own set of databases (issues, assets, commissioning).
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';
import { getSiteConfig } from '../config/sites.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection cache: { 'TTX:issues': db, 'TTX:assets': db, ... }
const connections = new Map();

/**
 * Get the base data directory path
 */
function getDataDir() {
  return path.join(__dirname, '../../data');
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Initialize issues database schema
 */
function initIssuesSchema(db) {
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
    CREATE INDEX IF NOT EXISTS idx_display_id ON issues(display_id);
  `);

  // Add display_id column if it doesn't exist (migration for existing databases)
  try {
    db.exec(`ALTER TABLE issues ADD COLUMN display_id INTEGER;`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.error('Error adding display_id column:', err.message);
    }
  }
}

/**
 * Initialize assets database schema
 */
function initAssetsSchema(db) {
  db.exec(`
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
}

/**
 * Initialize commissioning database schema
 */
function initCommissioningSchema(db) {
  db.exec(`
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
    db.exec(`ALTER TABLE commissioning_entries ADD COLUMN work_performed TEXT;`);
  } catch (error) {
    // Column already exists, ignore error
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding work_performed column:', error);
    }
  }
}

/**
 * Get database connection for a specific site and type
 *
 * @param {string} siteId - Site identifier (e.g., 'TTX')
 * @param {string} dbType - Database type ('issues', 'assets', or 'commissioning')
 * @returns {Database} Better-sqlite3 database instance
 */
function getDatabase(siteId, dbType) {
  // Create cache key
  const cacheKey = `${siteId}:${dbType}`;

  // Return cached connection if exists
  if (connections.has(cacheKey)) {
    return connections.get(cacheKey);
  }

  // Get site configuration
  const siteConfig = getSiteConfig(siteId);

  // Get database path from site config
  const dbRelativePath = siteConfig.databases[dbType];
  if (!dbRelativePath) {
    throw new Error(`Invalid database type: ${dbType}. Must be 'issues', 'assets', or 'commissioning'`);
  }

  // Build absolute path
  const dbPath = path.join(getDataDir(), dbRelativePath);

  // Ensure site directory exists
  const siteDir = path.dirname(dbPath);
  ensureDir(siteDir);

  // Create database connection
  const db = new Database(dbPath);

  // Initialize schema based on type
  switch (dbType) {
    case 'issues':
      initIssuesSchema(db);
      break;
    case 'assets':
      initAssetsSchema(db);
      break;
    case 'commissioning':
      initCommissioningSchema(db);
      break;
    default:
      throw new Error(`Unknown database type: ${dbType}`);
  }

  // Cache connection
  connections.set(cacheKey, db);

  console.log(`✅ Database initialized: ${siteId}/${dbType} at ${dbPath}`);

  return db;
}

/**
 * Get issues database for a site
 */
export function getIssuesDb(siteId) {
  return getDatabase(siteId, 'issues');
}

/**
 * Get assets database for a site
 */
export function getAssetsDb(siteId) {
  return getDatabase(siteId, 'assets');
}

/**
 * Get commissioning database for a site
 */
export function getCommissioningDb(siteId) {
  return getDatabase(siteId, 'commissioning');
}

/**
 * Close all database connections
 * Call this on server shutdown
 */
export function closeAllDatabases() {
  console.log('📦 Closing all database connections...');
  for (const [key, db] of connections.entries()) {
    try {
      db.close();
      console.log(`✅ Closed database: ${key}`);
    } catch (error) {
      console.error(`❌ Error closing database ${key}:`, error);
    }
  }
  connections.clear();
}

/**
 * Close specific database connection
 */
export function closeDatabase(siteId, dbType) {
  const cacheKey = `${siteId}:${dbType}`;
  if (connections.has(cacheKey)) {
    const db = connections.get(cacheKey);
    db.close();
    connections.delete(cacheKey);
    console.log(`✅ Closed database: ${cacheKey}`);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
  closeAllDatabases();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeAllDatabases();
  process.exit(0);
});

export default {
  getIssuesDb,
  getAssetsDb,
  getCommissioningDb,
  closeAllDatabases,
  closeDatabase
};
