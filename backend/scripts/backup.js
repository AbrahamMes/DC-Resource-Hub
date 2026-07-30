import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statfsSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { getBackupDir, getDataDir } from '../src/utils/storagePaths.js';
import { getSitesConfigPath } from '../src/config/sites.js';

const dataDir = getDataDir();
const backupRoot = getBackupDir();
const retentionDays = Number.parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const minimumFreeMb = Number.parseInt(process.env.BACKUP_MIN_FREE_MB || '1024', 10);

if (!Number.isInteger(retentionDays) || retentionDays < 1 || !Number.isInteger(minimumFreeMb) || minimumFreeMb < 0) {
  throw new Error('BACKUP_RETENTION_DAYS must be positive and BACKUP_MIN_FREE_MB must be zero or greater');
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const finalDir = path.join(backupRoot, timestamp);
const stagingDir = `${finalDir}.partial`;
const snapshotDataDir = path.join(stagingDir, 'data');

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

async function createSnapshot() {
  if (!existsSync(dataDir)) throw new Error(`Data directory does not exist: ${dataDir}`);
  mkdirSync(snapshotDataDir, { recursive: true });

  const sourceFiles = walkFiles(dataDir);
  for (const sourcePath of sourceFiles) {
    const relativePath = path.relative(dataDir, sourcePath);
    const destinationPath = path.join(snapshotDataDir, relativePath);
    mkdirSync(path.dirname(destinationPath), { recursive: true });

    if (path.extname(sourcePath).toLowerCase() === '.db') {
      const sourceDb = new Database(sourcePath, { readonly: true, fileMustExist: true });
      try {
        await sourceDb.backup(destinationPath);
      } finally {
        sourceDb.close();
      }
      const backupDb = new Database(destinationPath, { readonly: true, fileMustExist: true });
      try {
        const result = backupDb.pragma('integrity_check', { simple: true });
        if (result !== 'ok') throw new Error(`SQLite integrity check failed for ${relativePath}: ${result}`);
      } finally {
        backupDb.close();
      }
    } else {
      cpSync(sourcePath, destinationPath, { preserveTimestamps: true });
    }
  }

  const configSource = getSitesConfigPath();
  const configDestination = path.join(stagingDir, 'config', 'sites.json');
  mkdirSync(path.dirname(configDestination), { recursive: true });
  cpSync(configSource, configDestination, { preserveTimestamps: true });

  const files = walkFiles(stagingDir).map((filePath) => ({
    path: path.relative(stagingDir, filePath).replaceAll(path.sep, '/'),
    bytes: statSync(filePath).size,
    sha256: sha256(filePath)
  }));
  writeFileSync(path.join(stagingDir, 'manifest.json'), JSON.stringify({
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    sourceDataDirectory: dataDir,
    files
  }, null, 2));

  renameSync(stagingDir, finalDir);
}

function pruneExpiredSnapshots() {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const entry of readdirSync(backupRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.endsWith('.partial') || entry.name === timestamp) continue;
    const snapshotPath = path.join(backupRoot, entry.name);
    if (statSync(snapshotPath).mtimeMs < cutoff) rmSync(snapshotPath, { recursive: true, force: true });
  }
}

try {
  mkdirSync(backupRoot, { recursive: true });
  const filesystem = statfsSync(backupRoot);
  const freeBytes = filesystem.bavail * filesystem.bsize;
  if (freeBytes < minimumFreeMb * 1024 * 1024) {
    throw new Error(`Backup volume has less than ${minimumFreeMb} MB free`);
  }
  rmSync(stagingDir, { recursive: true, force: true });
  await createSnapshot();
  pruneExpiredSnapshots();
  console.log(`Backup completed: ${finalDir}`);
} catch (error) {
  rmSync(stagingDir, { recursive: true, force: true });
  console.error(`Backup failed: ${error.message}`);
  process.exitCode = 1;
}
