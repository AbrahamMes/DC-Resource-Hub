import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveSessionCookieSecure, validateProductionPublicUrls } from '../utils/publicUrls.js';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, '../../.env') });

function requiredSecret(name) {
  const value = process.env[name]?.trim();
  const placeholders = ['your_client_id_here', 'your_client_secret_here', 'your_random_session_secret_here'];
  if (!value || placeholders.includes(value)) {
    throw new Error(`${name} must be set to a non-placeholder value in the environment`);
  }
  return value;
}

function positiveNumber(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';
const allowInsecureHttp = process.env.ALLOW_INSECURE_HTTP === 'true'
  || process.env.ALLOW_INSECURE_LOCALHOST === 'true';
const allowedSameSiteValues = new Set(['lax', 'strict', 'none']);
const sessionCookieSameSite = (process.env.SESSION_COOKIE_SAME_SITE || 'lax').trim().toLowerCase();

if (!allowedSameSiteValues.has(sessionCookieSameSite)) {
  throw new Error('SESSION_COOKIE_SAME_SITE must be one of: lax, strict, none');
}

const sessionCookieSecure = resolveSessionCookieSecure({
  isProduction,
  allowInsecureHttp,
  configuredValue: process.env.SESSION_COOKIE_SECURE
});
const trustProxySetting = (process.env.TRUST_PROXY || '').trim();
const trustProxy = /^\d+$/.test(trustProxySetting)
  ? Number(trustProxySetting)
  : trustProxySetting || (isProduction ? 1 : false);

if (sessionCookieSameSite === 'none' && !sessionCookieSecure) {
  throw new Error('SESSION_COOKIE_SAME_SITE=none requires secure cookies and HTTPS');
}

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const additionalFrontendUrls = (process.env.ADDITIONAL_FRONTEND_URLS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const callbackUrl = process.env.APS_CALLBACK_URL || 'http://localhost:3001/api/auth/callback';
if (isProduction) {
  validateProductionPublicUrls({
    frontendUrl,
    callbackUrl,
    allowInsecureHttp
  });
}

export const config = {
  // Server
  port: process.env.PORT || 3001,
  sessionSecret: requiredSecret('SESSION_SECRET'),
  sessionTtlMs: Number(process.env.SESSION_TTL_HOURS || 24) * 60 * 60 * 1000,
  sessionCleanupIntervalMs: Number(process.env.SESSION_CLEANUP_MINUTES || 15) * 60 * 1000,
  issueRefreshIntervalMs: positiveNumber('ISSUE_REFRESH_INTERVAL_MINUTES', 60) * 60 * 1000,
  issueRefreshStartupDelayMs: positiveNumber('ISSUE_REFRESH_STARTUP_DELAY_SECONDS', 30) * 1000,
  siteAccessPin: isProduction ? requiredSecret('SITE_ACCESS_PIN') : process.env.SITE_ACCESS_PIN?.trim() || null,
  siteAccessTtlMs: positiveNumber('SITE_ACCESS_TTL_HOURS', 24) * 60 * 60 * 1000,
  siteAccessMaxAttempts: positiveNumber('SITE_ACCESS_MAX_ATTEMPTS', 5),
  siteAccessAttemptWindowMs: positiveNumber('SITE_ACCESS_LOCKOUT_MINUTES', 15) * 60 * 1000,
  frontendUrl,
  additionalFrontendUrls,
  trustProxy,
  sessionCookie: {
    secure: sessionCookieSecure,
    httpOnly: true,
    sameSite: sessionCookieSameSite
  },

  // Autodesk Platform Services (APS) - formerly Forge
  aps: {
    clientId: requiredSecret('APS_CLIENT_ID'),
    clientSecret: requiredSecret('APS_CLIENT_SECRET'),
    callbackUrl,

    // account:read is needed so we can read ACC project users
    // and find which users belong to Prime Controls.
    scope: 'data:read data:write account:read',

    authorizationUrl: 'https://developer.api.autodesk.com/authentication/v2/authorize',
    tokenUrl: 'https://developer.api.autodesk.com/authentication/v2/token',
    apiBaseUrl: 'https://developer.api.autodesk.com'
  },

  // ACC API Configuration
  acc: {
    issuesApiUrl: 'https://developer.api.autodesk.com/construction/issues/v1',
    assetsApiUrl: 'https://developer.api.autodesk.com/construction/assets/v2',
    adminApiUrl: 'https://developer.api.autodesk.com/construction/admin/v1'
  },

  // Security
  // Keep PIN-protected operations unavailable when the local PIN is not configured,
  // without preventing unrelated routes such as Autodesk login from starting.
  syncPin: isProduction ? requiredSecret('SYNC_PIN') : process.env.SYNC_PIN?.trim() || null
};

export default config;
