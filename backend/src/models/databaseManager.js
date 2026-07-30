/**
 * Site-Aware Database Manager
 *
 * Manages database connections for multiple sites with connection caching.
 * Each site has its own set of databases (issues, assets, commissioning).
 *
 * This version also safely migrates existing SQLite databases by adding
 * missing columns. This helps when a site database already exists but was
 * created before newer columns were added to the app.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';
import { getSiteConfig } from '../config/sites.js';
import { resolveDataPath } from '../utils/storagePaths.js';

// Connection cache: { 'TTX:issues': db, 'TTX:assets': db, ... }
const connections = new Map();

/**
 * Get the base data directory path
 */
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
 * Check if a table has a specific column
 */
function hasColumn(db, tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

/**
 * Add a column only if it does not already exist
 */
function addColumnIfMissing(db, tableName, columnName, columnDefinition) {
  if (!hasColumn(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`);
    console.log(`✅ Added missing column: ${tableName}.${columnName}`);
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
      title TEXT NOT NULL DEFAULT '',
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
      synced_at TEXT NOT NULL DEFAULT '',
      raw_data TEXT
    );
    CREATE TABLE IF NOT EXISTS issue_sync_status (
      project_id TEXT PRIMARY KEY,
      last_attempt_at TEXT,
      last_success_at TEXT,
      last_failure_at TEXT,
      last_error TEXT,
      last_trigger TEXT,
      last_issue_count INTEGER
    );
  `);

  // Migrate older issues tables
  addColumnIfMissing(db, 'issues', 'display_id', 'INTEGER');
  addColumnIfMissing(db, 'issues', 'title', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'issues', 'description', 'TEXT');
  addColumnIfMissing(db, 'issues', 'status', 'TEXT');
  addColumnIfMissing(db, 'issues', 'priority', 'TEXT');
  addColumnIfMissing(db, 'issues', 'assigned_to', 'TEXT');
  addColumnIfMissing(db, 'issues', 'assigned_to_id', 'TEXT');
  addColumnIfMissing(db, 'issues', 'created_at', 'TEXT');
  addColumnIfMissing(db, 'issues', 'updated_at', 'TEXT');
  addColumnIfMissing(db, 'issues', 'due_date', 'TEXT');
  addColumnIfMissing(db, 'issues', 'issue_type', 'TEXT');
  addColumnIfMissing(db, 'issues', 'root_cause', 'TEXT');
  addColumnIfMissing(db, 'issues', 'location_description', 'TEXT');
  addColumnIfMissing(db, 'issues', 'owner', 'TEXT');
  addColumnIfMissing(db, 'issues', 'owner_id', 'TEXT');
  addColumnIfMissing(db, 'issues', 'created_by', 'TEXT');
  addColumnIfMissing(db, 'issues', 'created_by_id', 'TEXT');
  addColumnIfMissing(db, 'issues', 'container_id', 'TEXT');
  addColumnIfMissing(db, 'issues', 'synced_at', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'issues', 'raw_data', 'TEXT');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_assigned_to_id ON issues(assigned_to_id);
    CREATE INDEX IF NOT EXISTS idx_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_created_at ON issues(created_at);
    CREATE INDEX IF NOT EXISTS idx_display_id ON issues(display_id);
    CREATE INDEX IF NOT EXISTS idx_due_date ON issues(due_date);
  `);
}

/**
 * Initialize assets database schema
 */
function initAssetsSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
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
      synced_at TEXT NOT NULL DEFAULT '',
      raw_data TEXT,
      excel_data TEXT DEFAULT 'false'
    );
  `);

  // Migrate older assets tables
  addColumnIfMissing(db, 'assets', 'name', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'assets', 'category', 'TEXT');
  addColumnIfMissing(db, 'assets', 'description', 'TEXT');
  addColumnIfMissing(db, 'assets', 'location', 'TEXT');
  addColumnIfMissing(db, 'assets', 'status', 'TEXT');
  addColumnIfMissing(db, 'assets', 'barcode', 'TEXT');
  addColumnIfMissing(db, 'assets', 'discipline', 'TEXT');
  addColumnIfMissing(db, 'assets', 'equipment_type', 'TEXT');
  addColumnIfMissing(db, 'assets', 'manufacturer', 'TEXT');
  addColumnIfMissing(db, 'assets', 'model_number', 'TEXT');
  addColumnIfMissing(db, 'assets', 'serial_number', 'TEXT');
  addColumnIfMissing(db, 'assets', 'meta_part_number', 'TEXT');
  addColumnIfMissing(db, 'assets', 'warranty_start_date', 'TEXT');
  addColumnIfMissing(db, 'assets', 'warranty_end_date', 'TEXT');
  addColumnIfMissing(db, 'assets', 'container_id', 'TEXT');
  addColumnIfMissing(db, 'assets', 'synced_at', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'assets', 'raw_data', 'TEXT');
  addColumnIfMissing(db, 'assets', 'excel_data', "TEXT DEFAULT 'false'");

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_asset_name ON assets(name);
    CREATE INDEX IF NOT EXISTS idx_asset_category ON assets(category);
    CREATE INDEX IF NOT EXISTS idx_asset_status ON assets(status);
    CREATE INDEX IF NOT EXISTS idx_asset_location ON assets(location);
    CREATE INDEX IF NOT EXISTS idx_asset_excel_data ON assets(excel_data);
  `);
}

/**
 * Initialize commissioning database schema
 */
function initCommissioningSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS commissioning_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL DEFAULT '',
      assets TEXT,
      work_performed TEXT,
      issues TEXT,
      needs_wants TEXT,
      delays TEXT,
      initials TEXT NOT NULL DEFAULT '',
      submitted_at TEXT NOT NULL DEFAULT '',
      created_date TEXT NOT NULL DEFAULT ''
    );
  `);

  // Migrate older commissioning tables
  addColumnIfMissing(db, 'commissioning_entries', 'location', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'commissioning_entries', 'assets', 'TEXT');
  addColumnIfMissing(db, 'commissioning_entries', 'work_performed', 'TEXT');
  addColumnIfMissing(db, 'commissioning_entries', 'issues', 'TEXT');
  addColumnIfMissing(db, 'commissioning_entries', 'needs_wants', 'TEXT');
  addColumnIfMissing(db, 'commissioning_entries', 'delays', 'TEXT');
  addColumnIfMissing(db, 'commissioning_entries', 'initials', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'commissioning_entries', 'submitted_at', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'commissioning_entries', 'created_date', "TEXT NOT NULL DEFAULT ''");

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_commissioning_location ON commissioning_entries(location);
    CREATE INDEX IF NOT EXISTS idx_commissioning_date ON commissioning_entries(created_date);
    CREATE INDEX IF NOT EXISTS idx_commissioning_submitted_at ON commissioning_entries(submitted_at);
  `);
}

/**
 * Get database connection for a specific site and type
 *
 * @param {string} siteId - Site identifier, such as TTX or TXE
 * @param {string} dbType - Database type: issues, assets, or commissioning
 * @returns {Database} Better-sqlite3 database instance
 */
function getDatabase(siteId, dbType) {
  const normalizedSiteId = siteId.toUpperCase();
  const cacheKey = `${normalizedSiteId}:${dbType}`;

  if (connections.has(cacheKey)) {
    return connections.get(cacheKey);
  }

  const siteConfig = getSiteConfig(normalizedSiteId);

  const dbRelativePath = siteConfig.databases[dbType];
  if (!dbRelativePath) {
    throw new Error(`Invalid database type: ${dbType}. Must be 'issues', 'assets', or 'commissioning'.`);
  }

  const dbPath = resolveDataPath(dbRelativePath, `${normalizedSiteId} ${dbType} database path`);
  const siteDir = path.dirname(dbPath);

  ensureDir(siteDir);

  const db = new Database(dbPath);

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

  connections.set(cacheKey, db);

  console.log(`✅ Database initialized: ${normalizedSiteId}/${dbType} at ${dbPath}`);

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
  const normalizedSiteId = siteId.toUpperCase();
  const cacheKey = `${normalizedSiteId}:${dbType}`;

  if (connections.has(cacheKey)) {
    const db = connections.get(cacheKey);
    db.close();
    connections.delete(cacheKey);
    console.log(`✅ Closed database: ${cacheKey}`);
  }
}

export default {
  getIssuesDb,
  getAssetsDb,
  getCommissioningDb,
  closeAllDatabases,
  closeDatabase
};
