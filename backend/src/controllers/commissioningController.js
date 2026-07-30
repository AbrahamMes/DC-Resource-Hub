import { getCommissioningDb, getAssetsDb } from '../models/databaseManager.js';

// Get unique locations directly from the site's synced assets.
export const getLocations = (req, res) => {
  try {
    const assetsDb = getAssetsDb(req.siteId);

    const dbLocations = assetsDb.prepare(`
      SELECT DISTINCT TRIM(location) AS location
      FROM assets
      WHERE TRIM(COALESCE(location, '')) != ''
      ORDER BY location COLLATE NOCASE ASC
    `).all();

    res.json({
      success: true,
      locations: dbLocations.map(({ location }) => location)
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations'
    });
  }
};

// Get assets filtered by location
export const getAssetsByLocation = (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location parameter is required'
      });
    }

    const assetsDb = getAssetsDb(req.siteId);
    const assets = assetsDb.prepare(`
      SELECT id, name, category, description, location
      FROM assets
      WHERE TRIM(COALESCE(location, '')) = TRIM(?)
      ORDER BY name COLLATE NOCASE ASC
    `).all(location);

    res.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error('Error fetching assets by location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets'
    });
  }
};

// Submit commissioning entry
export const submitEntry = (req, res) => {
  try {
    const { location, assets, workPerformed, issues, needsWants, delays, initials } = req.body;

    if (!location || !initials) {
      return res.status(400).json({
        success: false,
        error: 'Location and initials are required'
      });
    }

    const now = new Date();
    const submittedAt = now.toISOString();

    // Get local date in YYYY-MM-DD format (not UTC)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const createdDate = `${year}-${month}-${day}`;

    const commissioningDb = getCommissioningDb(req.siteId);
    const insert = commissioningDb.prepare(`
      INSERT INTO commissioning_entries (
        location, assets, work_performed, issues, needs_wants, delays, initials, submitted_at, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      location,
      assets ? JSON.stringify(assets) : null,
      workPerformed || null,
      issues || null,
      needsWants || null,
      delays || null,
      initials,
      submittedAt,
      createdDate
    );

    res.json({
      success: true,
      message: 'Commissioning entry submitted successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error submitting commissioning entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit entry'
    });
  }
};

// Get all commissioning entries
export const getAllEntries = (req, res) => {
  try {
    const commissioningDb = getCommissioningDb(req.siteId);
    const entries = commissioningDb.prepare(`
      SELECT *
      FROM commissioning_entries
      ORDER BY submitted_at DESC
    `).all();

    // Parse assets JSON
    const parsedEntries = entries.map(entry => ({
      ...entry,
      assets: entry.assets ? JSON.parse(entry.assets) : null
    }));

    res.json({
      success: true,
      entries: parsedEntries
    });
  } catch (error) {
    console.error('Error fetching commissioning entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries'
    });
  }
};

// Get commissioning entries grouped by date
export const getEntriesByDate = (req, res) => {
  try {
    const commissioningDb = getCommissioningDb(req.siteId);
    const assetsDb = getAssetsDb(req.siteId);

    const entries = commissioningDb.prepare(`
      SELECT *
      FROM commissioning_entries
      ORDER BY created_date DESC, submitted_at ASC
    `).all();

    // Get all assets for name lookup
    const allAssets = assetsDb.prepare(`
      SELECT id, name FROM assets
    `).all();

    const assetNameMap = new Map(allAssets.map(a => [a.id, a.name]));

    // Parse assets JSON, convert IDs to names, and group by date
    const parsedEntries = entries.map(entry => {
      let assetIds = entry.assets ? JSON.parse(entry.assets) : null;
      let assetNames = null;

      if (assetIds && Array.isArray(assetIds)) {
        assetNames = assetIds.map(id => assetNameMap.get(id) || id);
      }

      return {
        ...entry,
        assets: assetIds,
        assetNames: assetNames
      };
    });

    // Group by date
    const groupedByDate = parsedEntries.reduce((acc, entry) => {
      if (!acc[entry.created_date]) {
        acc[entry.created_date] = [];
      }
      acc[entry.created_date].push(entry);
      return acc;
    }, {});

    res.json({
      success: true,
      entriesByDate: groupedByDate
    });
  } catch (error) {
    console.error('Error fetching commissioning entries by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries'
    });
  }
};

// Delete commissioning entry
export const deleteEntry = (req, res) => {
  try {
    const { id } = req.params;

    const commissioningDb = getCommissioningDb(req.siteId);
    const deleteStmt = commissioningDb.prepare(`
      DELETE FROM commissioning_entries WHERE id = ?
    `);

    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting commissioning entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete entry'
    });
  }
};
