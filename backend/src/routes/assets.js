import express from 'express';
import { authorizeAssetSync, getLocalAssets, syncAssets, syncAssetsWithProgress, getSyncStatus, deleteAsset } from '../controllers/assetsController.js';
import { requireSite } from '../middleware/siteContext.js';

const router = express.Router();

// Apply site context to all routes
router.use(requireSite);

// Get assets from local database
router.get('/', getLocalAssets);

// Sync assets from ACC API (original - kept for backward compatibility)
router.post('/sync', syncAssets);

// Sync assets with SSE progress updates
router.post('/sync-authorize', authorizeAssetSync);
router.get('/sync-progress', syncAssetsWithProgress);

// Get sync status
router.get('/sync-status', getSyncStatus);

// Delete a specific asset
router.delete('/:assetId', deleteAsset);

export default router;
