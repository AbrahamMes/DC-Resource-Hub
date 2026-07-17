import axios from 'axios';
import { getIssuesDb } from '../models/databaseManager.js';
import config from '../config/config.js';
import { tokenErrorMessage } from '../services/autodeskTokenService.js';

const DEFAULT_PRIME_CONTROLS_ASSIGNED_TO_IDS = [
  '277458593',
  '595923917',
  '35C2BJAJKUECSQGN',
  'DJ52TVFQRUYFNK43'
];

function getValueByPath(obj, path) {
  return path.split('.').reduce((value, key) => {
    if (value && typeof value === 'object') {
      return value[key];
    }

    return undefined;
  }, obj);
}

function firstTextValue(obj, paths) {
  for (const path of paths) {
    const value = getValueByPath(obj, path);

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return '';
}

function normalizeId(value) {
  return String(value || '').trim().toLowerCase();
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseAssignedToName(issue) {
  const directValue = issue.assignedTo;

  if (typeof directValue === 'string' && directValue.trim()) {
    return directValue.trim();
  }

  if (directValue && typeof directValue === 'object') {
    const nestedName = firstTextValue(directValue, [
      'name',
      'displayName',
      'companyName',
      'company',
      'email',
      'value',
      'label'
    ]);

    if (nestedName) {
      return nestedName;
    }
  }

  return firstTextValue(issue, [
    'assignedToName',
    'assigned_to',
    'assignedToDisplayName',
    'assignedToUserName',
    'assigneeName',
    'assignee.name',
    'assignee.displayName',
    'assignedTo.name',
    'assignedTo.displayName',
    'assignedTo.companyName',
    'assignedTo.company',
    'assignedTo.email',
    'assignedTo.value',
    'assignedTo.label',
    'assignedTo.company.name',
    'assignedTo.company.displayName',
    'assignedTo.company.companyName'
  ]);
}

function parseAssignedToId(issue) {
  const directValue = issue.assignedTo;

  if (typeof directValue === 'string' && directValue.trim()) {
    return directValue.trim();
  }

  if (directValue && typeof directValue === 'object') {
    const nestedId = firstTextValue(directValue, [
      'id',
      'userId',
      'accountId',
      'autodeskId',
      'value'
    ]);

    if (nestedId) {
      return nestedId;
    }
  }

  return firstTextValue(issue, [
    'assignedToId',
    'assigned_to_id',
    'assigneeId',
    'assignee.id',
    'assignee.userId',
    'assignee.accountId',
    'assignee.autodeskId',
    'assignedTo.id',
    'assignedTo.userId',
    'assignedTo.accountId',
    'assignedTo.autodeskId'
  ]);
}

function getPrimeControlsIdSet(context) {
  const siteConfig = context.siteConfig || context;
  const siteConfigIds = Array.isArray(siteConfig?.primeControlsAssignedToIds)
    ? siteConfig.primeControlsAssignedToIds
    : [];

  const idsToUse = siteConfigIds.length > 0
    ? siteConfigIds
    : DEFAULT_PRIME_CONTROLS_ASSIGNED_TO_IDS;

  return new Set(
    idsToUse
      .map((id) => normalizeId(id))
      .filter(Boolean)
  );
}

function issueMatchesPrimeControls(issue, primeControlsIds) {
  const assignedToId = normalizeId(parseAssignedToId(issue));

  if (!primeControlsIds || primeControlsIds.size === 0) {
    return false;
  }

  // IMPORTANT:
  // Only match the actual assignedTo value.
  // Do not search raw_data because Prime Controls IDs can appear in watchers,
  // history, createdBy, updatedBy, or other fields and pull in unrelated issues.
  return assignedToId && primeControlsIds.has(assignedToId);
}

function resolveAssignedToName(issue, assignedToId, primeControlsIds) {
  const parsedName = parseAssignedToName(issue);

  if (
    assignedToId &&
    primeControlsIds.has(normalizeId(assignedToId)) &&
    (!parsedName || normalizeId(parsedName) === normalizeId(assignedToId))
  ) {
    return 'Prime Controls';
  }

  return parsedName || assignedToId || '';
}

function formatLocalIssue(issue, primeControlsIds) {
  const raw = safeJsonParse(issue.raw_data) || {};
  const assignedToId = issue.assigned_to_id || parseAssignedToId(raw);
  const issueRow = { ...issue };
  delete issueRow.raw_data;

  return {
    ...issueRow,
    assigned_to: resolveAssignedToName(
      { ...raw, assignedToName: issue.assigned_to },
      assignedToId,
      primeControlsIds
    ),
    assigned_to_id: assignedToId,
    assigned_to_type: raw.assignedToType || '',
    location_id: raw.locationId || '',
    issue_type_id: raw.issueTypeId || '',
    issue_subtype_id: raw.issueSubtypeId || '',
    opened_at: raw.openedAt || '',
    closed_at: raw.closedAt || '',
    comment_count: raw.commentCount ?? 0,
    attachment_count: raw.attachmentCount ?? 0,
    published: raw.published ?? null
  };
}

async function getAllIssuesFromAcc({ accessToken, projectId }) {
  const url = `${config.acc.issuesApiUrl}/projects/${projectId}/issues`;

  let allIssues = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      params: {
        limit,
        offset
      }
    });

    const pageIssues = response.data.results || response.data.data || [];
    const pagination = response.data.pagination || {};
    allIssues = allIssues.concat(pageIssues);

    console.log(`📥 ACC issues page: ${pageIssues.length} issues, total so far: ${allIssues.length}`);

    if (
      Number.isFinite(Number(pagination.totalResults)) &&
      allIssues.length >= Number(pagination.totalResults)
    ) {
      hasMore = false;
    } else if (pageIssues.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allIssues;
}

// Get issues from local database
export const getLocalIssues = (req, res) => {
  try {
    const db = getIssuesDb(req.siteId);
    const primeControlsIds = getPrimeControlsIdSet(req);
    const projectId = req.query.projectId || req.siteConfig.accProjectId;

    const issues = db.prepare(`
      SELECT id, display_id, title, description, status, priority, assigned_to, assigned_to_id,
             created_at, updated_at, due_date, issue_type, root_cause,
             location_description, owner, owner_id, created_by, created_by_id,
             container_id, synced_at, raw_data
      FROM issues
      WHERE container_id = ?
      ORDER BY created_at DESC
    `).all(projectId).map((issue) => formatLocalIssue(issue, primeControlsIds));

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

// Debug unique assignees from local issue database
export const getIssueAssigneesDebug = (req, res) => {
  try {
    const db = getIssuesDb(req.siteId);

    const rows = db.prepare(`
      SELECT assigned_to, assigned_to_id, COUNT(*) as count
      FROM issues
      GROUP BY assigned_to, assigned_to_id
      ORDER BY count DESC
    `).all();

    const sampleIssues = db.prepare(`
      SELECT id, display_id, title, status, assigned_to, assigned_to_id, raw_data
      FROM issues
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    const samples = sampleIssues.map((issue) => {
      const parsedRaw = safeJsonParse(issue.raw_data);

      return {
        id: issue.id,
        display_id: issue.display_id,
        title: issue.title,
        status: issue.status,
        assigned_to: issue.assigned_to,
        assigned_to_id: issue.assigned_to_id,
        raw_keys: parsedRaw ? Object.keys(parsedRaw) : [],
        raw_assignedTo: parsedRaw?.assignedTo || null,
        raw_assignedToName: parsedRaw?.assignedToName || null,
        raw_assignee: parsedRaw?.assignee || null
      };
    });

    res.json({
      success: true,
      assigneeCount: rows.length,
      assignees: rows,
      samples
    });
  } catch (error) {
    console.error('Error getting issue assignees debug:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get issue assignees debug',
      details: error.message
    });
  }
};

// Sync Prime Controls issues from ACC API to local database
export const syncIssues = async (req, res) => {
  const accessToken = req.session.accessToken;
  const projectId = req.body.projectId || req.query.projectId || req.siteConfig.accProjectId;
  const clearIssuesBeforeSync = req.siteConfig.clearIssuesBeforeSync === true;
  const primeControlsIds = getPrimeControlsIdSet(req);
  const db = getIssuesDb(req.siteId);

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      needsAuth: true,
      error: 'Authentication required'
    });
  }

  try {
    console.log('🔎 Syncing Prime Controls issues from ACC:', {
      site: req.siteId,
      projectId,
      clearIssuesBeforeSync,
      primeControlsAssignedToIds: Array.from(primeControlsIds)
    });

    const allIssues = await getAllIssuesFromAcc({
      accessToken,
      projectId
    });

    const issues = allIssues.filter((issue) =>
      issueMatchesPrimeControls(issue, primeControlsIds)
    );

    console.log(`✅ Filtered ${issues.length} Prime Controls issues from ${allIssues.length} total ACC issues`);

    const syncedAt = new Date().toISOString();

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

    const saveIssues = db.transaction((issuesToInsert) => {
      if (clearIssuesBeforeSync) {
        console.log(`🧹 Clearing old issues for site ${req.siteId} before saving Prime Controls issues`);
        db.prepare(`
          DELETE FROM issues
          WHERE container_id = ?
             OR container_id IS NULL
             OR container_id = ''
        `).run(projectId);
      }

      for (const issue of issuesToInsert) {
        const assignedToId = parseAssignedToId(issue);
        const assignedToName = resolveAssignedToName(
          issue,
          assignedToId,
          primeControlsIds
        );

        upsert.run({
          id: issue.id || issue.issueId,
          display_id: issue.displayId || issue.display_id || null,
          title: issue.title || issue.name || '',
          description: issue.description || '',
          status: issue.status || '',
          priority: issue.priority || '',
          assigned_to: assignedToName,
          assigned_to_id: assignedToId,
          created_at: issue.createdAt || issue.createdDate || issue.created_at || '',
          updated_at: issue.updatedAt || issue.modifiedDate || issue.updated_at || '',
          due_date: issue.dueDate || issue.due_date || '',
          issue_type: issue.issueType || issue.type || '',
          root_cause: issue.rootCause || issue.root_cause || '',
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

    saveIssues(issues);

    db.prepare(`
      INSERT INTO issue_sync_status (
        project_id, last_attempt_at, last_success_at, last_failure_at,
        last_error, last_trigger, last_issue_count
      ) VALUES (?, ?, ?, NULL, NULL, 'manual', ?)
      ON CONFLICT(project_id) DO UPDATE SET
        last_attempt_at = excluded.last_attempt_at,
        last_success_at = excluded.last_success_at,
        last_failure_at = NULL,
        last_error = NULL,
        last_trigger = excluded.last_trigger,
        last_issue_count = excluded.last_issue_count
    `).run(projectId, syncedAt, syncedAt, issues.length);

    res.json({
      success: true,
      message: `Successfully synced ${issues.length} Prime Controls issues from ${allIssues.length} total ACC issues`,
      count: issues.length,
      totalAccIssues: allIssues.length,
      primeControlsAssignedToIds: Array.from(primeControlsIds),
      syncedAt
    });
  } catch (error) {
    const failedAt = new Date().toISOString();
    const failedMessage = tokenErrorMessage(error);
    db.prepare(`
      INSERT INTO issue_sync_status (
        project_id, last_attempt_at, last_failure_at, last_error, last_trigger
      ) VALUES (?, ?, ?, ?, 'manual')
      ON CONFLICT(project_id) DO UPDATE SET
        last_attempt_at = excluded.last_attempt_at,
        last_failure_at = excluded.last_failure_at,
        last_error = excluded.last_error,
        last_trigger = excluded.last_trigger
    `).run(projectId, failedAt, failedAt, failedMessage);
    console.error('Error syncing Prime Controls issues from ACC:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const status = error.response?.status || 500;
    const errorMessage = tokenErrorMessage(error);

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
    const projectId = req.query.projectId || req.siteConfig.accProjectId;

    const result = db.prepare(`
      SELECT
        COUNT(*) as total_issues,
        MAX(synced_at) as last_sync,
        COUNT(DISTINCT assigned_to_id) as unique_assignees
      FROM issues
      WHERE container_id = ?
    `).get(projectId);

    const refreshStatus = db.prepare(`
      SELECT last_attempt_at, last_success_at, last_failure_at, last_error,
             last_trigger, last_issue_count
      FROM issue_sync_status
      WHERE project_id = ?
    `).get(projectId) || {};

    res.json({
      success: true,
      ...result,
      ...refreshStatus
    });
  } catch (error) {
    console.error('Error getting sync status:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
};

// Get top N issues by due date
export const getTopIssues = (req, res) => {
  const limit = parseInt(req.query.limit) || 3;

  try {
    const db = getIssuesDb(req.siteId);
    const projectId = req.query.projectId || req.siteConfig.accProjectId;

    const issues = db.prepare(`
      SELECT id, display_id, title, description, status, priority, assigned_to,
             due_date, issue_type, location_description, created_at
      FROM issues
      WHERE container_id = ?
        AND status != 'closed' AND due_date IS NOT NULL AND due_date != ''
      ORDER BY due_date ASC
      LIMIT ?
    `).all(projectId, limit);

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
