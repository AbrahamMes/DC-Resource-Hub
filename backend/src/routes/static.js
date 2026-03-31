/**
 * Static File Serving Routes
 *
 * Serves site-specific static files (building images, schedules, etc.)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { getSiteConfig } from '../config/sites.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Base data directory
const dataDir = path.join(__dirname, '../../data');

/**
 * GET /api/static/:siteId/building/:filename
 * Serve building/room images
 */
router.get('/:siteId/building/:filename', (req, res) => {
  try {
    const { siteId, filename } = req.params;

    // Validate site
    const siteConfig = getSiteConfig(siteId);

    // Build file path
    const filePath = path.join(dataDir, siteConfig.staticAssets.buildingsDir, filename);

    // Security: Ensure the resolved path is still within the buildings directory
    const buildingsDir = path.join(dataDir, siteConfig.staticAssets.buildingsDir);
    if (!filePath.startsWith(buildingsDir)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving building file:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/static/:siteId/schedule/:filename
 * Serve schedule images/PDFs
 */
router.get('/:siteId/schedule/:filename', (req, res) => {
  try {
    const { siteId, filename } = req.params;

    // Validate site
    const siteConfig = getSiteConfig(siteId);

    // Build file path based on filename
    let filePath;
    if (filename === 'schedule.jpg' || filename === 'schedule.png') {
      filePath = path.join(dataDir, siteConfig.staticAssets.scheduleImage);
    } else if (filename === '6-week.pdf') {
      filePath = path.join(dataDir, siteConfig.staticAssets.schedulePdf);
    } else {
      // Allow any file from schedules directory
      const schedulesDir = path.dirname(path.join(dataDir, siteConfig.staticAssets.scheduleImage));
      filePath = path.join(schedulesDir, filename);

      // Security check
      if (!filePath.startsWith(schedulesDir)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving schedule file:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/static/:siteId/contacts
 * Serve contacts JSON file
 */
router.get('/:siteId/contacts', (req, res) => {
  try {
    const { siteId } = req.params;

    // Validate site
    const siteConfig = getSiteConfig(siteId);

    // Build file path
    const filePath = path.join(dataDir, siteConfig.staticAssets.contacts);

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Contacts file not found'
      });
    }

    // Serve the file as JSON
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving contacts file:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/static/:siteId/excel
 * Download Excel asset list (requires authentication in production)
 */
router.get('/:siteId/excel', (req, res) => {
  try {
    const { siteId } = req.params;

    // Validate site
    const siteConfig = getSiteConfig(siteId);

    // Build file path
    const filePath = path.join(dataDir, siteConfig.staticAssets.excelFile);

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Excel file not found'
      });
    }

    // Serve the file with download header
    res.download(filePath);
  } catch (error) {
    console.error('Error serving Excel file:', error);
    const status = error.message.includes('Invalid site') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
