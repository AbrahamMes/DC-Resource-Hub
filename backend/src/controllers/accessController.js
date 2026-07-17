import crypto from 'crypto';
import config from '../config/config.js';

const attempts = new Map();
const attemptCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, state] of attempts) {
    if (state.resetAt <= now) attempts.delete(key);
  }
}, 15 * 60 * 1000);
attemptCleanupTimer.unref();

function attemptKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function getAttemptState(req) {
  const key = attemptKey(req);
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + config.siteAccessAttemptWindowMs };
    attempts.set(key, fresh);
    return { key, state: fresh };
  }

  return { key, state: current };
}

function pinsMatch(candidate, expected) {
  const candidateHash = crypto.createHash('sha256').update(candidate).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

export function accessStatus(req, res) {
  const expiresAt = Number(req.session?.siteAccessExpiresAt || 0);
  const unlocked = req.session?.siteAccessGranted === true && expiresAt > Date.now();

  res.json({
    success: true,
    unlocked,
    configured: Boolean(config.siteAccessPin),
    expiresAt: unlocked ? new Date(expiresAt).toISOString() : null
  });
}

export function unlockAccess(req, res) {
  if (!config.siteAccessPin) {
    return res.status(503).json({
      success: false,
      siteLocked: true,
      error: 'Website access PIN is not configured on the backend'
    });
  }

  const { key, state } = getAttemptState(req);
  if (state.count >= config.siteAccessMaxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((state.resetAt - Date.now()) / 1000));
    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(429).json({
      success: false,
      siteLocked: true,
      retryAfterSeconds,
      error: 'Too many incorrect attempts. Try again later.'
    });
  }

  const pin = String(req.body?.pin || '');
  if (!pin || !pinsMatch(pin, config.siteAccessPin)) {
    state.count += 1;
    attempts.set(key, state);
    return res.status(403).json({
      success: false,
      siteLocked: true,
      attemptsRemaining: Math.max(0, config.siteAccessMaxAttempts - state.count),
      error: 'Incorrect website PIN'
    });
  }

  attempts.delete(key);
  const expiresAt = Date.now() + config.siteAccessTtlMs;
  req.session.siteAccessGranted = true;
  req.session.siteAccessExpiresAt = expiresAt;

  req.session.save((error) => {
    if (error) {
      console.error('Failed to save website access session:', error);
      return res.status(500).json({ success: false, error: 'Failed to unlock website' });
    }

    res.json({
      success: true,
      unlocked: true,
      expiresAt: new Date(expiresAt).toISOString()
    });
  });
}

export function lockAccess(req, res) {
  delete req.session.siteAccessGranted;
  delete req.session.siteAccessExpiresAt;

  req.session.save((error) => {
    if (error) {
      console.error('Failed to lock website session:', error);
      return res.status(500).json({ success: false, error: 'Failed to lock website' });
    }
    res.json({ success: true, unlocked: false });
  });
}
