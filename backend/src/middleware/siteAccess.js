export function requireSiteAccess(req, res, next) {
  const expiresAt = Number(req.session?.siteAccessExpiresAt || 0);
  const authorized = req.session?.siteAccessGranted === true && expiresAt > Date.now();

  if (!authorized) {
    if (req.session?.siteAccessGranted) {
      delete req.session.siteAccessGranted;
      delete req.session.siteAccessExpiresAt;
    }

    return res.status(401).json({
      success: false,
      siteLocked: true,
      error: 'Website access PIN required'
    });
  }

  next();
}

export default requireSiteAccess;

