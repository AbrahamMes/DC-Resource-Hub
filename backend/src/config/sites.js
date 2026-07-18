/**
 * Site configuration is deployment data, not application source code.
 * Set SITES_CONFIG_PATH to a mounted JSON file in production.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = path.resolve(moduleDirectory, '../../config/sites.json');
const requiredDatabaseKeys = ['issues', 'assets', 'commissioning'];
const pathFields = ['excelFile', 'contacts', 'scheduleImage', 'schedulePdf', 'buildingsDir'];

let cachedSites;
let cachedConfigPath;

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function assertRelativeDataPath(value, field) {
  if (value == null || value === '') return;
  assertNonEmptyString(value, field);

  const normalized = value.replaceAll('\\', '/');
  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(value)) {
    throw new Error(`${field} must be relative to DATA_DIR, not an absolute path`);
  }
  if (normalized.split('/').includes('..')) {
    throw new Error(`${field} must not escape DATA_DIR`);
  }
}

function validateSite(site, index, ids) {
  const prefix = `sites[${index}]`;
  if (!site || typeof site !== 'object' || Array.isArray(site)) {
    throw new Error(`${prefix} must be an object`);
  }

  assertNonEmptyString(site.id, `${prefix}.id`);
  if (!/^[A-Za-z0-9_-]+$/.test(site.id)) {
    throw new Error(`${prefix}.id may contain only letters, numbers, underscores, and hyphens`);
  }
  const normalizedId = site.id.toUpperCase();
  if (ids.has(normalizedId)) throw new Error(`Duplicate site ID: ${site.id}`);
  ids.add(normalizedId);

  assertNonEmptyString(site.name, `${prefix}.name`);
  assertNonEmptyString(site.fullName, `${prefix}.fullName`);

  if (!Array.isArray(site.accProjects) || site.accProjects.length === 0) {
    throw new Error(`${prefix}.accProjects must contain at least one project`);
  }
  const projectIds = new Set();
  for (const [projectIndex, project] of site.accProjects.entries()) {
    assertNonEmptyString(project?.id, `${prefix}.accProjects[${projectIndex}].id`);
    assertNonEmptyString(project?.name, `${prefix}.accProjects[${projectIndex}].name`);
    if (projectIds.has(project.id)) throw new Error(`Duplicate project ID in site ${site.id}: ${project.id}`);
    projectIds.add(project.id);
  }

  const defaultProjectId = site.defaultAccProjectId || site.accProjectId;
  assertNonEmptyString(defaultProjectId, `${prefix}.defaultAccProjectId`);
  if (!projectIds.has(defaultProjectId)) {
    throw new Error(`${prefix}.defaultAccProjectId must reference one of the site's accProjects`);
  }

  if (!site.databases || typeof site.databases !== 'object') {
    throw new Error(`${prefix}.databases must be an object`);
  }
  for (const key of requiredDatabaseKeys) {
    assertNonEmptyString(site.databases[key], `${prefix}.databases.${key}`);
    assertRelativeDataPath(site.databases[key], `${prefix}.databases.${key}`);
  }
  for (const key of pathFields) {
    assertRelativeDataPath(site.staticAssets?.[key], `${prefix}.staticAssets.${key}`);
  }

  if (site.buildings != null && !Array.isArray(site.buildings)) {
    throw new Error(`${prefix}.buildings must be an array`);
  }

  return {
    ...site,
    id: normalizedId,
    defaultAccProjectId: defaultProjectId,
    // Temporary compatibility alias while callers migrate to defaultAccProjectId.
    accProjectId: defaultProjectId,
    buildings: site.buildings || [],
    staticAssets: site.staticAssets || {}
  };
}

export function getSitesConfigPath() {
  return path.resolve(process.env.SITES_CONFIG_PATH || defaultConfigPath);
}

export function loadSites() {
  const configPath = getSitesConfigPath();
  if (cachedSites && cachedConfigPath === configPath) return cachedSites;

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to load site configuration at ${configPath}: ${error.message}`);
  }

  const siteList = Array.isArray(parsed) ? parsed : parsed?.sites;
  if (!Array.isArray(siteList) || siteList.length === 0) {
    throw new Error(`Site configuration at ${configPath} must contain a non-empty "sites" array`);
  }

  const ids = new Set();
  cachedSites = Object.fromEntries(siteList.map((site, index) => {
    const validated = validateSite(site, index, ids);
    return [validated.id, validated];
  }));
  cachedConfigPath = configPath;
  return cachedSites;
}

export function getSiteConfig(siteId) {
  if (!siteId) throw new Error('Site ID is required');
  const sites = loadSites();
  const siteConfig = sites[String(siteId).toUpperCase()];
  if (!siteConfig) {
    throw new Error(`Invalid site ID: ${siteId}. Available sites: ${Object.keys(sites).join(', ')}`);
  }
  return siteConfig;
}

export function isValidSite(siteId) {
  return Boolean(siteId) && Object.hasOwn(loadSites(), String(siteId).toUpperCase());
}

export function getAllSiteIds() {
  return Object.keys(loadSites());
}

export function getDefaultSiteId() {
  const sites = loadSites();
  const configuredDefault = process.env.DEFAULT_SITE_ID?.toUpperCase();
  if (configuredDefault && !Object.hasOwn(sites, configuredDefault)) {
    throw new Error(`DEFAULT_SITE_ID '${process.env.DEFAULT_SITE_ID}' is not present in the site configuration`);
  }
  return configuredDefault || Object.keys(sites)[0];
}

export function getAllSites() {
  return Object.values(loadSites()).map(({ id, name, fullName, description, accProjects, defaultAccProjectId }) => ({
    id,
    name,
    fullName,
    description,
    accProjects,
    defaultAccProjectId
  }));
}

export function getBuildingConfig(siteId, buildingId) {
  return getSiteConfig(siteId).buildings.find((building) => building.id === buildingId) || null;
}

export function getRoomConfig(siteId, buildingId, roomId) {
  return getBuildingConfig(siteId, buildingId)?.rooms?.find((room) => room.id === roomId) || null;
}

export function clearSitesCache() {
  cachedSites = undefined;
  cachedConfigPath = undefined;
}

export default new Proxy({}, {
  ownKeys: () => Reflect.ownKeys(loadSites()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  get: (_target, property) => loadSites()[property]
});
