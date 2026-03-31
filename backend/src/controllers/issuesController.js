import axios from 'axios';
import { getIssuesDb } from '../models/databaseManager.js';
import config from '../config/config.js';

// Get issues from local database
export const getLocalIssues = (req, res) => {
  try {
    const db = getIssuesDb(req.siteId);
    const issues = db.prepare(`
      SELECT id, display_id, title, description, status, priority, assigned_to, assigned_to_id,
             created_at, updated_at, due_date, issue_type, root_cause,
             location_description, owner, owner_id, created_by, created_by_id,
             container_id, synced_at
      FROM issues
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    console.error('Error fetching local issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issues from database'
    });
  }
};

// Sync issues from ACC API to local database
export const syncIssues = async (req, res) => {
  const accessToken = req.session.accessToken;
  const projectId = req.body.projectId || req.siteConfig.accProjectId;
  const assignedToId = req.body.assignedToId || req.siteConfig.accAssignedToId;
  const db = getIssuesDb(req.siteId);

  try {
    // Fetch ALL issues from ACC API using pagination
    const url = `${config.acc.issuesApiUrl}/projects/${projectId}/issues`;
    let allIssues = [];
    let offset = 0;
    const limit = 100; // Fetch 100 at a time
    let hasMore = true;

    // Build base params
    const baseParams = {
      limit
    };

    // Only filter by assignedTo if it's not a placeholder
    if (assignedToId && assignedToId !== 'PLACEHOLDER_ASSIGNED_TO_ID') {
      baseParams['filter[assignedTo]'] = assignedToId;
    }

    // Paginate through all issues
    while (hasMore) {
      const params = {
        ...baseParams,
        offset
      };

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      const pageIssues = response.data.results || response.data.data || [];
      allIssues = allIssues.concat(pageIssues);

      // Check if there are more pages
      if (pageIssues.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    const issues = allIssues;
    const syncedAt = new Date().toISOString();

    // Prepare insert/update statement
    const upsert = db.prepare(`
      INSERT OR REPLACE INTO issues (
        id, display_id, title, description, status, priority, assigned_to, assigned_to_id,
        created_at, updated_at, due_date, issue_type, root_cause,
        location_description, owner, owner_id, created_by, created_by_id,
        container_id, synced_at, raw_data
      ) VALUES (
        @id, @display_id, @title, @description, @status, @priority, @assigned_to, @assigned_to_id,
        @created_at, @updated_at, @due_date, @issue_type, @root_cause,
        @location_description, @owner, @owner_id, @created_by, @created_by_id,
        @container_id, @synced_at, @raw_data
      )
    `);

    // Process and store each issue
    const insertMany = db.transaction((issues) => {
      for (const issue of issues) {
        upsert.run({
          id: issue.id || issue.issueId,
          display_id: issue.displayId || null,
          title: issue.title || issue.name || '',
          description: issue.description || '',
          status: issue.status || '',
          priority: issue.priority || '',
          assigned_to: issue.assignedTo || issue.assignedToName || '',
          assigned_to_id: issue.assignedToId || assignedToId,
          created_at: issue.createdAt || issue.createdDate || '',
          updated_at: issue.updatedAt || issue.modifiedDate || '',
          due_date: issue.dueDate || '',
          issue_type: issue.issueType || issue.type || '',
          root_cause: issue.rootCause || '',
          location_description: issue.locationDescription || issue.location || '',
          owner: issue.owner || issue.ownerName || '',
          owner_id: issue.ownerId || '',
          created_by: issue.createdBy || issue.createdByName || '',
          created_by_id: issue.createdById || '',
          container_id: issue.containerId || projectId,
          synced_at: syncedAt,
          raw_data: JSON.stringify(issue)
        });
      }
    });

    insertMany(issues);

    res.json({
      success: true,
      message: `Successfully synced ${issues.length} issues from ACC API`,
      count: issues.length,
      syncedAt
    });

  } catch (error) {
    console.error('Error syncing issues from ACC:', error.response?.data || error.message);

    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to sync issues';

    res.status(status).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
};

// Get sync status/metadata
export const getSyncStatus = (req, res) => {
  try {
    const db = getIssuesDb(req.siteId);
    const result = db.prepare(`
      SELECT
        COUNT(*) as total_issues,
        MAX(synced_at) as last_sync,
        COUNT(DISTINCT assigned_to_id) as unique_assignees
      FROM issues
    `).get();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
};

// Get top N issues by due date (for dashboard/home page)
export const getTopIssues = (req, res) => {
  const limit = parseInt(req.query.limit) || 3;

  try {
    const db = getIssuesDb(req.siteId);
    const issues = db.prepare(`
      SELECT id, display_id, title, description, status, priority, assigned_to,
             due_date, issue_type, location_description, created_at
      FROM issues
      WHERE status != 'closed' AND due_date IS NOT NULL AND due_date != ''
      ORDER BY due_date ASC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    console.error('Error fetching top issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top issues'
    });
  }
};

// Delete a specific issue from local database
export const deleteIssue = (req, res) => {
  const { issueId } = req.params;

  try {
    const db = getIssuesDb(req.siteId);
    const result = db.prepare('DELETE FROM issues WHERE id = ?').run(issueId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete issue'
    });
  }
};
