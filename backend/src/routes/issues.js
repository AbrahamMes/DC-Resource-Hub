import express from 'express';
import {
  getLocalIssues,
  syncIssues,
  getSyncStatus,
  getTopIssues,
  getIssueAssigneesDebug,
  deleteIssue
} from '../controllers/issuesController.js';
import { requireAuth } from '../middleware/auth.js';
import { siteContext } from '../middleware/siteContext.js';

const router = express.Router();

// Apply site context to all issue routes
router.use(siteContext);

// Get issues from local database
router.get('/', getLocalIssues);

// Get top N issues by due date
router.get('/top', getTopIssues);

// Debug assignees from local database
router.get('/debug-assignees', getIssueAssigneesDebug);

// Sync all issues from ACC API
router.post('/sync', requireAuth, syncIssues);

// Get sync status/metadata
router.get('/sync-status', getSyncStatus);

// Delete a specific issue from local database
router.delete('/:issueId', deleteIssue);

export default router;