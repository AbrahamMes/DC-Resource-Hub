import { getAllSiteIds, getSiteConfig } from '../config/sites.js';
import { getIssuesDb } from '../models/databaseManager.js';
import { syncIssues } from '../controllers/issuesController.js';
import { syncAssetsForProject } from '../controllers/assetsController.js';
import { getValidAccessToken, tokenErrorMessage } from './autodeskTokenService.js';

function saveSession(store, sid, sessionData) {
  return new Promise((resolve, reject) =>
    store.set(sid, sessionData, (error) => error ? reject(error) : resolve())
  );
}

function invokeIssueSync({ siteId, siteConfig, sessionData, projectId }) {
  return new Promise((resolve, reject) => {
    let statusCode = 200;
    const req = {
      session: sessionData,
      body: { projectId },
      query: {},
      siteId,
      siteConfig
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode, payload });
      }
    };

    Promise.resolve(syncIssues(req, res)).catch(reject);
  });
}

function recordSchedulerFailure(siteId, projectId, error) {
  const failedAt = new Date().toISOString();
  const message = tokenErrorMessage(error);
  const db = getIssuesDb(siteId);
  db.prepare(`
    INSERT INTO issue_sync_status (
      project_id, last_attempt_at, last_failure_at, last_error, last_trigger
    ) VALUES (?, ?, ?, ?, 'hourly')
    ON CONFLICT(project_id) DO UPDATE SET
      last_attempt_at = excluded.last_attempt_at,
      last_failure_at = excluded.last_failure_at,
      last_error = excluded.last_error,
      last_trigger = excluded.last_trigger
  `).run(projectId, failedAt, failedAt, message);
}

function markHourlySuccess(siteId, projectId) {
  getIssuesDb(siteId).prepare(`
    UPDATE issue_sync_status SET last_trigger = 'hourly' WHERE project_id = ?
  `).run(projectId);
}

export function startIssueRefreshScheduler({
  sessionStore,
  intervalMs,
  startupDelayMs,
  sessionTtlMs
}) {
  let running = false;

  async function refreshAllSites() {
    if (running) {
      console.warn('Hourly ACC issue refresh skipped because the previous run is still active');
      return;
    }

    running = true;
    try {
      const savedSession = sessionStore.findMostRecentWithRefreshToken();
      if (!savedSession) {
        const error = new Error('Interactive Autodesk login required; no renewable saved authorization is available');
        for (const siteId of getAllSiteIds()) {
          const siteConfig = getSiteConfig(siteId);
          for (const project of siteConfig.accProjects) {
            recordSchedulerFailure(siteId, project.id, error);
          }
        }
        console.warn(`Hourly ACC issue refresh failed: ${error.message}`);
        return;
      }

      const { sid, sessionData } = savedSession;
      await getValidAccessToken(sessionData);

      // Keep the server-side authorization renewable while hourly sync remains active.
      // The browser cookie still follows its own expiry and logout destroys this row.
      sessionData.cookie = sessionData.cookie || {};
      sessionData.cookie.expires = new Date(Date.now() + sessionTtlMs).toISOString();
      sessionData.cookie.maxAge = sessionTtlMs;
      await saveSession(sessionStore, sid, sessionData);

      for (const siteId of getAllSiteIds()) {
        const siteConfig = getSiteConfig(siteId);
        for (const project of siteConfig.accProjects) {
          const result = await invokeIssueSync({
            siteId,
            siteConfig,
            sessionData,
            projectId: project.id
          });
          if (!result.payload?.success) {
            const error = new Error(result.payload?.error || `ACC sync failed with HTTP ${result.statusCode}`);
            recordSchedulerFailure(siteId, project.id, error);
            console.error(`Hourly ACC issue refresh failed for ${siteId}/${project.name}:`, error.message);
          } else {
            markHourlySuccess(siteId, project.id);
            console.log(`Hourly ACC issue refresh completed for ${siteId}/${project.name}: ${result.payload.count} issues`);
          }

          try {
            const assetResult = await syncAssetsForProject({
              accessToken: sessionData.accessToken,
              siteId,
              siteConfig,
              projectId: project.id
            });
            console.log(`Hourly ACC asset refresh completed for ${siteId}/${project.name}: ${assetResult.count} assets`);
          } catch (error) {
            console.error(`Hourly ACC asset refresh failed for ${siteId}/${project.name}:`, tokenErrorMessage(error));
          }
        }
      }
    } catch (error) {
      console.error('Hourly ACC issue refresh failed:', tokenErrorMessage(error));
      for (const siteId of getAllSiteIds()) {
        const siteConfig = getSiteConfig(siteId);
        for (const project of siteConfig.accProjects) {
          recordSchedulerFailure(siteId, project.id, error);
        }
      }
    } finally {
      running = false;
    }
  }

  const startupTimer = setTimeout(refreshAllSites, startupDelayMs);
  const intervalTimer = setInterval(refreshAllSites, intervalMs);
  startupTimer.unref();
  intervalTimer.unref();

  console.log(`ACC issue and asset refresh scheduled every ${Math.round(intervalMs / 60000)} minutes`);

  return {
    runNow: refreshAllSites,
    close() {
      clearTimeout(startupTimer);
      clearInterval(intervalTimer);
    }
  };
}

export default startIssueRefreshScheduler;
