import axios from 'axios';
import config from '../config/config.js';

// Initiate OAuth flow - redirect user to Autodesk login
export const login = (req, res) => {
  const authUrl = `${config.aps.authorizationUrl}?` +
    `response_type=code&` +
    `client_id=${config.aps.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.aps.callbackUrl)}&` +
    `scope=${encodeURIComponent(config.aps.scope)}`;

  res.json({ authUrl });
};

// Handle OAuth callback from Autodesk
export const callback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${config.frontendUrl}/issues?error=no_code`);
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      config.aps.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: config.aps.clientId,
        client_secret: config.aps.clientSecret,
        redirect_uri: config.aps.callbackUrl
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Store tokens in session
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;
    req.session.expiresAt = new Date(Date.now() + expires_in * 1000);

    // Redirect back to frontend
    res.redirect(`${config.frontendUrl}/issues?auth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.redirect(`${config.frontendUrl}/issues?error=auth_failed`);
  }
};

// Check authentication status
export const status = (req, res) => {
  if (req.session.accessToken) {
    const isExpired = req.session.expiresAt && new Date() > new Date(req.session.expiresAt);
    res.json({
      authenticated: !isExpired,
      expiresAt: req.session.expiresAt
    });
  } else {
    res.json({
      authenticated: false
    });
  }
};

// Logout - clear session
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
};
