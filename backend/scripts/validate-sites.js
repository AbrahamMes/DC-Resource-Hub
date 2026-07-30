import fs from 'node:fs';
import path from 'node:path';

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const configPath = argumentValue('--config');
if (configPath) process.env.SITES_CONFIG_PATH = path.resolve(configPath);
const initialize = process.argv.includes('--initialize');

try {
  const { getAllSiteIds, getDefaultSiteId, getSiteConfig, getSitesConfigPath } = await import('../src/config/sites.js');
  const { getBackupDir, getDataDir, resolveDataPath } = await import('../src/utils/storagePaths.js');

  const siteIds = getAllSiteIds();
  const defaultSiteId = getDefaultSiteId();

  if (initialize) {
    const dataDir = getDataDir();
    const backupDir = getBackupDir();
    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(backupDir, { recursive: true });
    fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
    fs.accessSync(backupDir, fs.constants.R_OK | fs.constants.W_OK);

    for (const siteId of siteIds) {
      const site = getSiteConfig(siteId);
      for (const relativePath of Object.values(site.databases)) {
        fs.mkdirSync(path.dirname(resolveDataPath(relativePath)), { recursive: true });
      }
      for (const relativePath of Object.values(site.staticAssets)) {
        if (typeof relativePath !== 'string' || relativePath === '') continue;
        const resolved = resolveDataPath(relativePath);
        const directory = relativePath.endsWith('/') || path.extname(relativePath) === ''
          ? resolved
          : path.dirname(resolved);
        fs.mkdirSync(directory, { recursive: true });
      }
    }

    const { closeAllDatabases, getAssetsDb, getCommissioningDb, getIssuesDb } = await import('../src/models/databaseManager.js');
    try {
      for (const siteId of siteIds) {
        getIssuesDb(siteId);
        getAssetsDb(siteId);
        getCommissioningDb(siteId);
      }
    } finally {
      closeAllDatabases();
    }
  }

  console.log(`Site configuration valid: ${getSitesConfigPath()}`);
  console.log(`Sites: ${siteIds.join(', ')}`);
  console.log(`Default site: ${defaultSiteId}`);
  if (initialize) console.log(`Initialized persistent storage: ${getDataDir()}`);
} catch (error) {
  console.error(`Site validation failed: ${error.message}`);
  process.exitCode = 1;
}
