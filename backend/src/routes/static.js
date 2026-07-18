/**
 * Static File Serving Routes
 *
 * Serves site-specific static files (building images, schedules, etc.)
 */

import express from 'express';
import path from 'path';
import { existsSync } from 'fs';
import { getSiteConfig } from '../config/sites.js';
import { resolveDataPath, resolveWithinRoot } from '../utils/storagePaths.js';

const router = express.Router();

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
    const buildingsDir = resolveDataPath(siteConfig.staticAssets.buildingsDir, `${siteId} buildings directory`);
    const filePath = resolveWithinRoot(buildingsDir, filename, 'Building filename');

    // Security: Ensure the resolved path is still within the buildings directory
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
      filePath = resolveDataPath(siteConfig.staticAssets.scheduleImage, `${siteId} schedule image path`);
    } else if (filename === '6-week.pdf') {
      filePath = resolveDataPath(siteConfig.staticAssets.schedulePdf, `${siteId} schedule PDF path`);
    } else {
      // Allow any file from schedules directory
      const schedulesDir = path.dirname(resolveDataPath(siteConfig.staticAssets.scheduleImage, `${siteId} schedules directory`));
      filePath = resolveWithinRoot(schedulesDir, filename, 'Schedule filename');
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
    const filePath = resolveDataPath(siteConfig.staticAssets.contacts, `${siteId} contacts path`);

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
    const filePath = resolveDataPath(siteConfig.staticAssets.excelFile, `${siteId} Excel path`);

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
