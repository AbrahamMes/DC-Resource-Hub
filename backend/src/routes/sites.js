import express from 'express';
import { getAllSites, getSiteConfig } from '../config/sites.js';

const router = express.Router();

// Get all available sites
router.get('/', (req, res) => {
  try {
    const sites = getAllSites();

    res.json({
      success: true,
      sites
    });
  } catch (error) {
    console.error('Error getting sites:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get sites',
      message: error.message
    });
  }
});

// Get one site config by ID
router.get('/:siteId', (req, res) => {
  try {
    const { siteId } = req.params;
    const siteConfig = getSiteConfig(siteId);

    res.json({
      success: true,
      site: {
        id: siteConfig.id,
        name: siteConfig.name,
        fullName: siteConfig.fullName,
        description: siteConfig.description,
        accProjects: siteConfig.accProjects,
        defaultAccProjectId: siteConfig.defaultAccProjectId,
        buildings: siteConfig.buildings,
        staticAssets: siteConfig.staticAssets
      }
    });
  } catch (error) {
    console.error('Error getting site config:', error);

    res.status(404).json({
      success: false,
      error: 'Site not found',
      message: error.message
    });
  }
});

export default router;
