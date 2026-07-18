import express from 'express';
import cors from 'cors';
import session from 'express-session';
import config from './config/config.js';
import authRoutes from './routes/auth.js';
import issuesRoutes from './routes/issues.js';
import assetsRoutes from './routes/assets.js';
import commissioningRoutes from './routes/commissioning.js';
import sitesRoutes from './routes/sites.js';
import staticRoutes from './routes/static.js';
import schedulesRoutes from './routes/schedules.js';
import contactsRoutes from './routes/contacts.js';
import accessRoutes from './routes/access.js';
import { requireSiteAccess } from './middleware/siteAccess.js';
import { assertSingleInstanceEnvironment } from './utils/singleInstanceGuard.js';
import SqliteSessionStore from './session/sqliteSessionStore.js';
import { startIssueRefreshScheduler } from './services/issueRefreshScheduler.js';
import { getDataDir, resolveDataPath } from './utils/storagePaths.js';
import { closeAllDatabases } from './models/databaseManager.js';
import { getAllSiteIds } from './config/sites.js';
import { mkdirSync } from 'node:fs';

assertSingleInstanceEnvironment();
mkdirSync(getDataDir(), { recursive: true });
getAllSiteIds();

const sessionStore = new SqliteSessionStore({
  dbPath: resolveDataPath('sessions.db', 'Session database path'),
  cleanupIntervalMs: config.sessionCleanupIntervalMs,
  defaultTtlMs: config.sessionTtlMs
});
const issueRefreshScheduler = startIssueRefreshScheduler({
  sessionStore,
  intervalMs: config.issueRefreshIntervalMs,
  startupDelayMs: config.issueRefreshStartupDelayMs,
  sessionTtlMs: config.sessionTtlMs
});

const app = express();

// Render and most production hosts terminate HTTPS at a reverse proxy. Express
// must trust that proxy before it can recognize the original HTTPS request and
// issue Secure session cookies.
if (config.trustProxy) {
  app.set('trust proxy', config.trustProxy);
}

// Middleware
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === config.frontendUrl) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      try {
        const url = new URL(origin);
        const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        const isPrivateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
        if ((isLocalHost || isPrivateLan) && url.port === '5173') return callback(null, true);
      } catch {
        // Invalid origins are rejected below.
      }
    }

    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session configuration
app.use(session({
  store: sessionStore,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.sessionCookie.secure,
    httpOnly: config.sessionCookie.httpOnly,
    sameSite: config.sessionCookie.sameSite,
    maxAge: config.sessionTtlMs
  }
}));

// Public routes used before the website has been unlocked.
app.use('/api/access', accessRoutes);
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    multiSite: true,
    accessPinConfigured: Boolean(config.siteAccessPin),
    config: {
      hasClientId: !!config.aps.clientId,
      hasClientSecret: !!config.aps.clientSecret
    }
  });
});

// All dashboard data, files, and Autodesk authentication routes require the
// front-door website PIN. Administrative actions retain their separate PIN.
app.use('/api', requireSiteAccess);

// Private routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/static', staticRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/commissioning', commissioningRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/contacts', contactsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`🚀 ACC Issues Backend (Multi-Site) running on http://localhost:${PORT}`);
  console.log(`📊 Frontend URL: ${config.frontendUrl}`);
  console.log(`🔑 APS Client ID configured: ${!!config.aps.clientId}`);
  console.log(`🌐 Multi-site support enabled`);
  console.log(`📍 Available sites: Check /api/sites`);
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down gracefully`);
  issueRefreshScheduler.close();

  server.close(() => {
    try {
      sessionStore.close();
      closeAllDatabases();
      process.exit(0);
    } catch (error) {
      console.error('Graceful shutdown failed:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Graceful shutdown timed out');
    process.exit(1);
  }, 10_000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

export default app;
