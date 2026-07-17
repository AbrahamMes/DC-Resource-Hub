import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';

const snapshotDir = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !existsSync(snapshotDir)) {
  console.error('Usage: npm run backup:verify -- <backup-directory>');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(path.join(snapshotDir, 'manifest.json'), 'utf8'));
const restoreDir = mkdtempSync(path.join(os.tmpdir(), 'acc-backup-restore-'));

try {
  cpSync(path.join(snapshotDir, 'data'), path.join(restoreDir, 'data'), { recursive: true });
  for (const file of manifest.files) {
    const sourcePath = path.join(snapshotDir, ...file.path.split('/'));
    const digest = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
    if (digest !== file.sha256) throw new Error(`Checksum mismatch: ${file.path}`);
  }

  const databaseFiles = manifest.files.filter((file) => file.path.startsWith('data/') && file.path.endsWith('.db'));
  for (const file of databaseFiles) {
    const restoredPath = path.join(restoreDir, ...file.path.split('/'));
    const db = new Database(restoredPath, { readonly: true, fileMustExist: true });
    try {
      const result = db.pragma('integrity_check', { simple: true });
      if (result !== 'ok') throw new Error(`SQLite integrity check failed: ${file.path}: ${result}`);
    } finally {
      db.close();
    }
  }
  console.log(`Restore test passed: ${manifest.files.length} files, ${databaseFiles.length} databases`);
} catch (error) {
  console.error(`Restore test failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(restoreDir, { recursive: true, force: true });
}
