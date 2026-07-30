/**
 * Site Context Middleware
 *
 * Extracts and validates site information from requests and attaches
 * site configuration to req.siteId and req.siteConfig.
 */

import { getDefaultSiteId, getSiteConfig, isValidSite } from '../config/sites.js';

/**
 * Middleware to extract and validate site context from request
 *
 * Looks for site ID in the following order:
 * 1. Query parameter: ?site=TTX
 * 2. Request body: { site: 'TTX' }
 * 3. Session: req.session.siteId
 *
 * If no site is specified, uses DEFAULT_SITE_ID or the first configured site.
 *
 * Attaches the following to request object:
 * - req.siteId: The site identifier (e.g., 'TTX')
 * - req.siteConfig: Full site configuration object
 */
export function siteContext(req, res, next) {
  try {
    // Extract site ID from request (priority: query > body > session > configured default)
    let siteId = req.query.site || req.body?.site || req.session?.siteId || getDefaultSiteId();

    // Normalize to uppercase
    siteId = siteId.toUpperCase();

    // Validate site ID
    if (!isValidSite(siteId)) {
      return res.status(400).json({
        error: 'Invalid site',
        message: `Site '${siteId}' does not exist. Please specify a valid site ID.`
      });
    }

    // Get site configuration
    const siteConfig = getSiteConfig(siteId);

    // Any project selected by a client must belong to this site. Controllers
    // may still use the site's configured default when no project is supplied.
    const projectId = req.query.projectId || req.body?.projectId;
    if (projectId && !siteConfig.accProjects.some((project) => project.id === projectId)) {
      return res.status(400).json({
        error: 'Invalid ACC project',
        message: `Project '${projectId}' is not configured for site '${siteId}'.`
      });
    }

    // Attach to request object
    req.siteId = siteId;
    req.siteConfig = siteConfig;

    // Store in session for persistence
    if (req.session) {
      req.session.siteId = siteId;
    }

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('Site context middleware error:', error);
    return res.status(500).json({
      error: 'Site configuration error',
      message: error.message
    });
  }
}

/**
 * Optional middleware to require site parameter (no default fallback)
 *
 * Use this for routes where site must be explicitly specified
 */
export function requireSite(req, res, next) {
  const siteId = req.query.site || req.body?.site;

  if (!siteId) {
    return res.status(400).json({
      error: 'Missing site parameter',
      message: 'Please specify a site ID using the "site" query parameter or in request body'
    });
  }

  // Continue with normal siteContext middleware
  siteContext(req, res, next);
}

export default siteContext;
