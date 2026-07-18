import fs from 'fs';
import { resolveDataPath } from './storagePaths.js';

/**
 * Location Mapper Utility
 * Maps ACC asset locations to building/room IDs for floor plan display
 */

// Cache for location mappings by site
const mappingCache = new Map();

/**
 * Load location mapping for a site
 * @param {string} siteId - Site ID (e.g., 'TTX', 'TXE')
 * @returns {object} Location mapping configuration
 */
function loadLocationMapping(siteId) {
  if (mappingCache.has(siteId)) {
    return mappingCache.get(siteId);
  }

  const mappingPath = resolveDataPath(`${siteId}/location_mapping.json`, `${siteId} location mapping path`);

  try {
    if (!fs.existsSync(mappingPath)) {
      console.warn(`Location mapping not found for site ${siteId}: ${mappingPath}`);
      return { mappings: [], patterns: [] };
    }

    const content = fs.readFileSync(mappingPath, 'utf8');
    const mapping = JSON.parse(content);

    mappingCache.set(siteId, mapping);
    return mapping;
  } catch (error) {
    console.error(`Error loading location mapping for ${siteId}:`, error);
    return { mappings: [], patterns: [] };
  }
}

/**
 * Map an ACC location string to building and room IDs
 * @param {string} siteId - Site ID
 * @param {string} accLocation - ACC location string (e.g., "DCB1 > AREA A > Ground > 1A1")
 * @returns {object|null} { buildingId, roomId } or null if no match
 */
export function mapLocation(siteId, accLocation) {
  if (!accLocation || typeof accLocation !== 'string') {
    return null;
  }

  const mapping = loadLocationMapping(siteId);

  // Try exact match first
  const exactMatch = mapping.mappings?.find(m => m.accLocation === accLocation);
  if (exactMatch) {
    return {
      buildingId: exactMatch.buildingId,
      roomId: exactMatch.roomId
    };
  }

  // Try pattern match
  const patternMatch = mapping.patterns?.find(p => {
    try {
      const regex = new RegExp(p.pattern);
      return regex.test(accLocation);
    } catch (error) {
      console.error(`Invalid regex pattern: ${p.pattern}`, error);
      return false;
    }
  });

  if (patternMatch) {
    return {
      buildingId: patternMatch.buildingId,
      roomId: patternMatch.roomId
    };
  }

  return null;
}

/**
 * Get all assets for a specific room
 * @param {string} siteId - Site ID
 * @param {string} buildingId - Building ID
 * @param {string} roomId - Room ID
 * @param {Array} allAssets - Array of all assets with location field
 * @returns {Array} Array of assets that belong to this room
 */
export function getAssetsForRoom(siteId, buildingId, roomId, allAssets) {
  if (!Array.isArray(allAssets)) {
    return [];
  }

  const roomAssets = [];

  for (const asset of allAssets) {
    if (!asset.location) continue;

    const mapped = mapLocation(siteId, asset.location);
    if (mapped && mapped.buildingId === buildingId && mapped.roomId === roomId) {
      roomAssets.push(asset);
    }
  }

  return roomAssets;
}

/**
 * Get location statistics for a site
 * @param {string} siteId - Site ID
 * @param {Array} allAssets - Array of all assets
 * @returns {object} Statistics about mapped vs unmapped locations
 */
export function getLocationStats(siteId, allAssets) {
  if (!Array.isArray(allAssets)) {
    return { total: 0, mapped: 0, unmapped: 0, byRoom: {} };
  }

  const stats = {
    total: allAssets.length,
    mapped: 0,
    unmapped: 0,
    byRoom: {}
  };

  for (const asset of allAssets) {
    if (!asset.location) {
      stats.unmapped++;
      continue;
    }

    const mapped = mapLocation(siteId, asset.location);
    if (mapped) {
      stats.mapped++;
      const key = `${mapped.buildingId}/${mapped.roomId}`;
      stats.byRoom[key] = (stats.byRoom[key] || 0) + 1;
    } else {
      stats.unmapped++;
    }
  }

  return stats;
}

/**
 * Clear mapping cache (useful for testing or when mapping file changes)
 */
export function clearMappingCache() {
  mappingCache.clear();
}
