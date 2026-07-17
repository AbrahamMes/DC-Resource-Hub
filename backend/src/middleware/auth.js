import { getValidAccessToken, tokenErrorMessage } from '../services/autodeskTokenService.js';

// Middleware to check if user is authenticated
export const requireAuth = async (req, res, next) => {
  if (!req.session.accessToken && !req.session.refreshToken) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please login first',
      needsAuth: true
    });
  }

  try {
    await getValidAccessToken(req.session);
    await new Promise((resolve, reject) =>
      req.session.save((error) => error ? reject(error) : resolve())
    );
    next();
  } catch (error) {
    return res.status(401).json({
      error: tokenErrorMessage(error),
      message: 'Your Autodesk authorization could not be renewed. Please login again.',
      needsAuth: true
    });
  }
};

// Middleware to attach access token to request if available
export const attachToken = (req, res, next) => {
  if (req.session.accessToken) {
    req.accessToken = req.session.accessToken;
  }
  next();
};
