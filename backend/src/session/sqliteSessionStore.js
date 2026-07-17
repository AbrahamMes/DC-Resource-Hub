import session from 'express-session';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export class SqliteSessionStore extends session.Store {
  constructor({ dbPath, cleanupIntervalMs = 15 * 60 * 1000, defaultTtlMs = 24 * 60 * 60 * 1000 }) {
    super();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.defaultTtlMs = defaultTtlMs;
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);

    const columns = this.db.prepare('PRAGMA table_info(sessions)').all();
    if (!columns.some((column) => column.name === 'updated_at')) {
      this.db.exec('ALTER TABLE sessions ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0');
    }

    this.getStatement = this.db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expires_at > ?');
    this.setStatement = this.db.prepare(`
      INSERT INTO sessions (sid, sess, expires_at, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(sid) DO UPDATE SET
        sess = excluded.sess,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
    `);
    this.destroyStatement = this.db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.cleanupStatement = this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
    this.touchStatement = this.db.prepare('UPDATE sessions SET expires_at = ? WHERE sid = ?');

    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
    this.cleanupTimer.unref();
    this.cleanup();
  }

  expiration(sessionData) {
    const cookieExpiry = sessionData?.cookie?.expires && new Date(sessionData.cookie.expires).getTime();
    return Number.isFinite(cookieExpiry) ? cookieExpiry : Date.now() + this.defaultTtlMs;
  }

  get(sid, callback) {
    try {
      const row = this.getStatement.get(sid, Date.now());
      callback(null, row ? JSON.parse(row.sess) : null);
    } catch (error) {
      callback(error);
    }
  }

  set(sid, sessionData, callback = () => {}) {
    try {
      const now = Date.now();
      this.setStatement.run(sid, JSON.stringify(sessionData), this.expiration(sessionData), now);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.destroyStatement.run(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, sessionData, callback = () => {}) {
    try {
      this.touchStatement.run(this.expiration(sessionData), sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  cleanup() {
    try {
      this.cleanupStatement.run(Date.now());
    } catch (error) {
      this.emit('disconnect', error);
    }
  }

  findMostRecentWithRefreshToken() {
    const rows = this.db.prepare(`
      SELECT sid, sess
      FROM sessions
      WHERE expires_at > ?
      ORDER BY updated_at DESC
    `).all(Date.now());

    for (const row of rows) {
      try {
        const sessionData = JSON.parse(row.sess);
        if (sessionData.refreshToken) return { sid: row.sid, sessionData };
      } catch {
        // Ignore malformed rows; express-session will also be unable to use them.
      }
    }

    return null;
  }

  close() {
    clearInterval(this.cleanupTimer);
    this.db.close();
  }
}

export default SqliteSessionStore;
