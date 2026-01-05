// Middleware to check if user is authenticated
export const requireAuth = (req, res, next) => {
  if (!req.session.accessToken) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please login first',
      needsAuth: true
    });
  }

  // Check if token is expired
  if (req.session.expiresAt && new Date() > new Date(req.session.expiresAt)) {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Your session has expired. Please login again.',
      needsAuth: true
    });
  }

  next();
};

// Middleware to attach access token to request if available
export const attachToken = (req, res, next) => {
  if (req.session.accessToken) {
    req.accessToken = req.session.accessToken;
  }
  next();
};
