import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3001,
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Autodesk Platform Services (APS) - formerly Forge
  aps: {
    clientId: process.env.APS_CLIENT_ID,
    clientSecret: process.env.APS_CLIENT_SECRET,
    callbackUrl: process.env.APS_CALLBACK_URL || 'http://localhost:3001/api/auth/callback',
    scope: 'data:read data:write',
    authorizationUrl: 'https://developer.api.autodesk.com/authentication/v2/authorize',
    tokenUrl: 'https://developer.api.autodesk.com/authentication/v2/token',
    apiBaseUrl: 'https://developer.api.autodesk.com'
  },

  // ACC API Configuration (project-specific IDs moved to sites.js)
  acc: {
    issuesApiUrl: 'https://developer.api.autodesk.com/construction/issues/v1',
    assetsApiUrl: 'https://developer.api.autodesk.com/construction/assets/v2'
  },

  // Security
  syncPin: process.env.SYNC_PIN || '1725'
};

export default config;
