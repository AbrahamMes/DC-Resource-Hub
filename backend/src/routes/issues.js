import express from 'express';
import { getLocalIssues, syncIssues, getSyncStatus, getTopIssues, deleteIssue } from '../controllers/issuesController.js';
import { requireAuth } from '../middleware/auth.js';
import { siteContext } from '../middleware/siteContext.js';

const router = express.Router();

// Apply site context to all routes
router.use(siteContext);

// Get issues from local database (no auth required for reading)
router.get('/', getLocalIssues);

// Get top N issues by due date
router.get('/top', getTopIssues);

// Sync issues from ACC API (requires authentication)
router.post('/sync', requireAuth, syncIssues);

// Get sync status/metadata
router.get('/sync-status', getSyncStatus);

// Delete a specific issue from local database
router.delete('/:issueId', deleteIssue);

export default router;
