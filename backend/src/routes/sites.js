/**
 * Sites API Routes
 *
 * Provides metadata about available sites
 */

import express from 'express';
import { getAllSites, getSiteConfig, getBuildingConfig, getRoomConfig } from '../config/sites.js';
import { getAssetsDb } from '../models/databaseManager.js';
import { getAssetsForRoom } from '../utils/locationMapper.js';

const router = express.Router();

/**
 * GET /api/sites
 * List all available sites
 */
router.get('/', (req, res) => {
  try {
    const sites = getAllSites();
    res.json({
      success: true,
      sites
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sites'
    });
  }
});

/**
 * GET /api/sites/:siteId
 * Get configuration for a specific site (sanitized - no sensitive data)
 */
router.get('/:siteId', (req, res) => {
  try {
    const { siteId } = req.params;
    const siteConfig = getSiteConfig(siteId);

    // Return sanitized configuration (exclude sensitive data)
    const sanitized = {
      id: siteConfig.id,
      name: siteConfig.name,
      fullName: siteConfig.fullName,
      buildings: siteConfig.buildings,
      // Do NOT expose: accProjectId, accAssignedToId, database paths, file paths
    };

    res.json({
      success: true,
      site: sanitized
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sites/:siteId/buildings/:buildingId
 * Get configuration for a specific building
 */
router.get('/:siteId/buildings/:buildingId', (req, res) => {
  try {
    const { siteId, buildingId } = req.params;
    const building = getBuildingConfig(siteId, buildingId);

    if (!building) {
      return res.status(404).json({
        success: false,
        error: `Building '${buildingId}' not found in site '${siteId}'`
      });
    }

    res.json({
      success: true,
      building
    });
  } catch (error) {
    console.error('Error fetching building config:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sites/:siteId/buildings/:buildingId/rooms/:roomId
 * Get configuration for a specific room
 */
router.get('/:siteId/buildings/:buildingId/rooms/:roomId', (req, res) => {
  try {
    const { siteId, buildingId, roomId } = req.params;
    const room = getRoomConfig(siteId, buildingId, roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: `Room '${roomId}' not found in building '${buildingId}' at site '${siteId}'`
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Error fetching room config:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sites/:siteId/buildings/:buildingId/rooms/:roomId/assets
 * Get all assets for a specific room
 */
router.get('/:siteId/buildings/:buildingId/rooms/:roomId/assets', (req, res) => {
  try {
    const { siteId, buildingId, roomId } = req.params;

    // Verify room exists
    const room = getRoomConfig(siteId, buildingId, roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: `Room '${roomId}' not found in building '${buildingId}' at site '${siteId}'`
      });
    }

    // Get site config for ACC project ID
    const siteConfig = getSiteConfig(siteId);

    // Get all assets from database
    const assetsDb = getAssetsDb(siteId);
    const allAssets = assetsDb.prepare(`
      SELECT id, name, location, category, status, barcode,
             manufacturer, model_number, serial_number
      FROM assets
      WHERE location != '' AND location IS NOT NULL
    `).all();

    // Filter assets for this room using location mapper
    const roomAssets = getAssetsForRoom(siteId, buildingId, roomId, allAssets);

    res.json({
      success: true,
      count: roomAssets.length,
      accProjectId: siteConfig.accProjectId,
      assets: roomAssets
    });
  } catch (error) {
    console.error('Error fetching room assets:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
