import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function getDataDir() {
  return path.resolve(process.env.DATA_DIR || path.join(backendDirectory, 'data'));
}

export function getBackupDir() {
  return path.resolve(process.env.BACKUP_DIR || path.join(backendDirectory, 'backups'));
}

export function resolveWithinRoot(root, relativePath, label = 'Path') {
  if (typeof relativePath !== 'string' || relativePath.trim() === '') {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  if (path.posix.isAbsolute(relativePath.replaceAll('\\', '/')) || path.win32.isAbsolute(relativePath)) {
    throw new Error(`${label} must be relative to its configured root`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolvedPath);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes its configured root`);
  }
  return resolvedPath;
}

export function resolveDataPath(relativePath, label = 'Data path') {
  return resolveWithinRoot(getDataDir(), relativePath, label);
}
