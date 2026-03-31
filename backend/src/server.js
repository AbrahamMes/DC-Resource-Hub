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

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/static', staticRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/commissioning', commissioningRoutes);
app.use('/api/schedules', schedulesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    multiSite: true,
    config: {
      hasClientId: !!config.aps.clientId,
      hasClientSecret: !!config.aps.clientSecret
    }
  });
});

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
app.listen(PORT, () => {
  console.log(`🚀 ACC Issues Backend (Multi-Site) running on http://localhost:${PORT}`);
  console.log(`📊 Frontend URL: ${config.frontendUrl}`);
  console.log(`🔑 APS Client ID configured: ${!!config.aps.clientId}`);
  console.log(`🌐 Multi-site support enabled`);
  console.log(`📍 Available sites: Check /api/sites`);
});

export default app;
