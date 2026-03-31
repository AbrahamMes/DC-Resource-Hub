import axios from 'axios';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAssetsDb } from '../models/databaseManager.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get assets from local database
export const getLocalAssets = (req, res) => {
  try {
    const assetsDb = getAssetsDb(req.siteId);
    // Only return assets that match the Excel filter
    const assets = assetsDb.prepare(`
      SELECT id, name, category, description, location, status, barcode,
             discipline, equipment_type, manufacturer, model_number, serial_number,
             meta_part_number, warranty_start_date, warranty_end_date,
             container_id, synced_at
      FROM assets
      WHERE excel_data = 'true'
      ORDER BY name ASC
    `).all();

    res.json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    console.error('Error fetching local assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets from database'
    });
  }
};

// Read asset data from Excel file
const getExcelAssetData = (excelPath) => {
  try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Create a map of asset name -> full data
    const assetMap = new Map();
    data.forEach(row => {
      if (row.Name && row.Name.trim() !== '') {
        assetMap.set(row.Name, {
          name: row.Name,
          category: row.Category || '',
          location: row.Location || '',
          description: row.Description || ''
        });
      }
    });

    console.log(`📋 Found ${assetMap.size} assets in Excel file`);
    return assetMap;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
};

// Read asset names from Excel file (for backward compatibility)
const getAssetNamesFromExcel = (excelPath) => {
  const excelData = getExcelAssetData(excelPath);
  return Array.from(excelData.keys());
};

// Sync assets from ACC API to local database with SSE progress
export const syncAssetsWithProgress = async (req, res) => {
  const accessToken = req.session.accessToken;
  const projectId = req.query.projectId || req.siteConfig.accProjectId;
  const pin = req.query.pin;
  const assetsDb = getAssetsDb(req.siteId);

  // Get Excel path from site config
  const excelPath = path.join(__dirname, '../../data', req.siteConfig.staticAssets.excelFile);

  // Check PIN first
  if (pin !== config.syncPin) {
    res.write(`data: ${JSON.stringify({ error: 'Invalid PIN. Please enter the correct PIN to proceed with sync.', needsPin: true })}\n\n`);
    return res.end();
  }

  if (!accessToken) {
    res.write(`data: ${JSON.stringify({ error: 'Authentication required', needsAuth: true })}\n\n`);
    return res.end();
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Read asset data from Excel
    res.write(`data: ${JSON.stringify({ stage: 'excel', message: 'Reading Excel file...' })}\n\n`);
    const excelAssetData = getExcelAssetData(excelPath);
    const excelAssetNames = Array.from(excelAssetData.keys());
    const excelAssetNamesSet = new Set(excelAssetNames);

    res.write(`data: ${JSON.stringify({ stage: 'excel', message: `Found ${excelAssetNames.length} assets in Excel`, count: excelAssetNames.length })}\n\n`);

    // Fetch ALL assets from ACC API using cursor-based pagination
    const baseUrl = `${config.acc.assetsApiUrl}/projects/${projectId}/assets`;
    let allAssets = [];
    const limit = 100;
    let hasMore = true;
    let requestCount = 0;
    const seenAssetIds = new Set(); // Track IDs to detect duplicates
    let cursorState = null; // For cursor-based pagination

    res.write(`data: ${JSON.stringify({ stage: 'fetching', message: 'Fetching assets from ACC API...', totalFetched: 0, requestCount: 0 })}\n\n`);

    while (hasMore) {
      // Build params - use cursorState if we have it from previous request
      const params = {
        limit
      };
      if (cursorState) {
        params.cursorState = cursorState;
      }

      const response = await axios.get(baseUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      requestCount++;
      const pageAssets = response.data.results || response.data.data || [];
      const pagination = response.data.pagination || {};

      console.log(`📊 Request ${requestCount}: Received ${pageAssets.length} assets, Pagination:`, JSON.stringify(pagination));

      // Log first asset structure on first request
      if (requestCount === 1 && pageAssets.length > 0) {
        console.log('📋 Sample asset structure from ACC API:');
        console.log('  Keys:', Object.keys(pageAssets[0]));
        console.log('  First asset:', JSON.stringify(pageAssets[0], null, 2));
      }

      // Filter out duplicate assets (check by ID)
      let duplicateCount = 0;
      const uniquePageAssets = pageAssets.filter(asset => {
        const assetId = asset.id || asset.assetId;
        if (seenAssetIds.has(assetId)) {
          duplicateCount++;
          return false;
        }
        seenAssetIds.add(assetId);
        return true;
      });

      allAssets = allAssets.concat(uniquePageAssets);

      console.log(`📊 After filtering: ${uniquePageAssets.length} unique assets, ${duplicateCount} duplicates, Total so far: ${allAssets.length}`);

      // If ALL assets in this page are duplicates, we're definitely looping
      if (duplicateCount > 0 && uniquePageAssets.length === 0) {
        res.write(`data: ${JSON.stringify({
          stage: 'warning',
          message: `⚠️ All ${duplicateCount} assets in this page are duplicates - stopping pagination`
        })}\n\n`);
        hasMore = false;
        continue;
      }

      res.write(`data: ${JSON.stringify({
        stage: 'fetching',
        message: `Fetched ${allAssets.length} assets (Request ${requestCount})`,
        totalFetched: allAssets.length,
        requestCount: requestCount,
        lastBatchSize: pageAssets.length,
        uniqueInBatch: uniquePageAssets.length,
        duplicatesInBatch: duplicateCount
      })}\n\n`);

      // Update cursorState for next request from pagination metadata
      if (pagination.cursorState) {
        cursorState = pagination.cursorState;
      }

      // Stop if: no assets returned, fewer than limit, or no nextUrl (API indicates end)
      if (pageAssets.length === 0) {
        hasMore = false;
      } else if (pageAssets.length < limit) {
        hasMore = false;
      } else if (!pagination.nextUrl) {
        // No nextUrl means we've reached the end
        hasMore = false;
      } else if (pagination.totalResults && allAssets.length >= pagination.totalResults) {
        // If API provides total count, stop when we've fetched all
        hasMore = false;
      } else if (requestCount > 200) {
        // Safety limit: stop after 200 requests (20,000 assets at 100 per page)
        res.write(`data: ${JSON.stringify({
          stage: 'warning',
          message: '⚠️ Safety limit reached: stopped after 200 API requests'
        })}\n\n`);
        hasMore = false;
      }
      // Continue to next page using updated cursorState
    }

    res.write(`data: ${JSON.stringify({ stage: 'saving', message: 'Saving all assets to database...', totalFetched: allAssets.length })}\n\n`);

    const syncedAt = new Date().toISOString();

    // Prepare insert/update statement - store ALL assets with excel_data flag
    const upsert = assetsDb.prepare(`
      INSERT OR REPLACE INTO assets (
        id, name, category, description, location, status, barcode,
        discipline, equipment_type, manufacturer, model_number, serial_number,
        meta_part_number, warranty_start_date, warranty_end_date,
        container_id, synced_at, raw_data, excel_data
      ) VALUES (
        @id, @name, @category, @description, @location, @status, @barcode,
        @discipline, @equipment_type, @manufacturer, @model_number, @serial_number,
        @meta_part_number, @warranty_start_date, @warranty_end_date,
        @container_id, @synced_at, @raw_data, @excel_data
      )
    `);

    // Process and store ALL assets, marking which ones are in Excel
    let excelMatchCount = 0;
    const insertMany = assetsDb.transaction((assets) => {
      for (const asset of assets) {
        const assetName = asset.clientAssetId || asset.name || asset.assetName || '';
        const inExcel = excelAssetNamesSet.has(assetName);
        const excelInfo = inExcel ? excelAssetData.get(assetName) : null;
        if (inExcel) excelMatchCount++;

        upsert.run({
          id: asset.id || asset.assetId,
          name: asset.clientAssetId || asset.name || asset.assetName || '',
          // Merge Excel category and location with ACC data (Excel takes priority)
          category: (excelInfo?.category) || asset.category || asset.assetCategory || '',
          description: asset.description || (excelInfo?.description) || '',
          location: (excelInfo?.location) || asset.location || asset.locationDescription || '',
          status: asset.status || asset.assetStatus || '',
          barcode: asset.barcode || '',
          discipline: asset.discipline || '',
          equipment_type: asset.equipmentType || asset.equipment_type || '',
          manufacturer: asset.manufacturer || '',
          model_number: asset.modelNumber || asset.model_number || '',
          serial_number: asset.serialNumber || asset.serial_number || '',
          meta_part_number: asset.metaPartNumber || asset.meta_part_number || '',
          warranty_start_date: asset.warrantyStartDate || asset.warranty_start_date || '',
          warranty_end_date: asset.warrantyEndDate || asset.warranty_end_date || '',
          container_id: asset.containerId || projectId,
          synced_at: syncedAt,
          raw_data: JSON.stringify(asset),
          excel_data: inExcel ? 'true' : 'false'
        });
      }
    });

    insertMany(allAssets);

    console.log(`📊 Stored ${allAssets.length} total assets, ${excelMatchCount} match Excel filter`);

    res.write(`data: ${JSON.stringify({
      stage: 'complete',
      success: true,
      message: `Successfully synced ${allAssets.length} assets (${excelMatchCount} match Excel)`,
      count: allAssets.length,
      excelMatches: excelMatchCount,
      excelCount: excelAssetNames.length,
      requestCount: requestCount,
      syncedAt
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('Error syncing assets from ACC:', error.response?.data || error.message);

    const errorMessage = error.response?.data?.message || error.message || 'Failed to sync assets';

    res.write(`data: ${JSON.stringify({
      stage: 'error',
      success: false,
      error: errorMessage
    })}\n\n`);

    res.end();
  }
};

// Original sync function (kept for backward compatibility)
export const syncAssets = async (req, res) => {
  const accessToken = req.session.accessToken;
  const projectId = req.body.projectId || req.siteConfig.accProjectId;
  const assetsDb = getAssetsDb(req.siteId);

  // Get Excel path from site config
  const excelPath = path.join(__dirname, '../../data', req.siteConfig.staticAssets.excelFile);

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      needsAuth: true,
      error: 'Authentication required'
    });
  }

  try {
    // Read asset data from Excel
    const excelAssetData = getExcelAssetData(excelPath);
    const excelAssetNames = Array.from(excelAssetData.keys());
    const excelAssetNamesSet = new Set(excelAssetNames);

    // Fetch ALL assets from ACC API using cursor-based pagination
    const baseUrl = `${config.acc.assetsApiUrl}/projects/${projectId}/assets`;
    let allAssets = [];
    const limit = 100;
    let hasMore = true;
    const seenAssetIds = new Set(); // Track IDs to detect duplicates
    let cursorState = null; // For cursor-based pagination

    console.log('🔄 Fetching assets from ACC API...');

    while (hasMore) {
      // Build params - use cursorState if we have it from previous request
      const params = {
        limit
      };
      if (cursorState) {
        params.cursorState = cursorState;
      }

      const response = await axios.get(baseUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      const pageAssets = response.data.results || response.data.data || [];
      const pagination = response.data.pagination || {};

      console.log(`📊 Request: Received ${pageAssets.length} assets, Pagination:`, JSON.stringify(pagination));

      // Filter out duplicate assets (check by ID)
      let duplicateCount = 0;
      const uniquePageAssets = pageAssets.filter(asset => {
        const assetId = asset.id || asset.assetId;
        if (seenAssetIds.has(assetId)) {
          duplicateCount++;
          return false;
        }
        seenAssetIds.add(assetId);
        return true;
      });

      allAssets = allAssets.concat(uniquePageAssets);

      console.log(`  Fetched ${pageAssets.length} assets, Unique: ${uniquePageAssets.length}, Duplicates: ${duplicateCount}, Total: ${allAssets.length}`);

      // If ALL assets in this page are duplicates, we're definitely looping
      if (duplicateCount > 0 && uniquePageAssets.length === 0) {
        console.warn(`  ⚠️ All ${duplicateCount} assets in this page are duplicates - stopping pagination`);
        hasMore = false;
        continue;
      }

      // Update cursorState for next request from pagination metadata
      if (pagination.cursorState) {
        cursorState = pagination.cursorState;
      }

      // Stop if: no assets returned, fewer than limit, or no nextUrl (API indicates end)
      if (pageAssets.length === 0) {
        hasMore = false;
      } else if (pageAssets.length < limit) {
        hasMore = false;
      } else if (!pagination.nextUrl) {
        // No nextUrl means we've reached the end
        hasMore = false;
      } else if (pagination.totalResults && allAssets.length >= pagination.totalResults) {
        // If API provides total count, stop when we've fetched all
        hasMore = false;
      } else if (allAssets.length > 20000) {
        // Safety limit: stop after 20,000 assets
        console.error('⚠️ Safety limit reached: stopped after fetching 20,000 assets');
        hasMore = false;
      }
      // Continue to next page using updated cursorState
    }

    console.log(`✅ Total assets fetched from ACC: ${allAssets.length}`);

    // Filter assets to only include those in the Excel file
    // ACC API uses 'clientAssetId' as the asset name, not 'name' or 'assetName'
    const filteredAssets = allAssets.filter(asset => {
      const assetName = asset.clientAssetId || asset.name || asset.assetName || '';
      return excelAssetNamesSet.has(assetName);
    });

    console.log(`✅ Assets matching Excel file: ${filteredAssets.length}`);

    const syncedAt = new Date().toISOString();

    // Prepare insert/update statement - store ALL assets with excel_data flag
    const upsert = assetsDb.prepare(`
      INSERT OR REPLACE INTO assets (
        id, name, category, description, location, status, barcode,
        discipline, equipment_type, manufacturer, model_number, serial_number,
        meta_part_number, warranty_start_date, warranty_end_date,
        container_id, synced_at, raw_data, excel_data
      ) VALUES (
        @id, @name, @category, @description, @location, @status, @barcode,
        @discipline, @equipment_type, @manufacturer, @model_number, @serial_number,
        @meta_part_number, @warranty_start_date, @warranty_end_date,
        @container_id, @synced_at, @raw_data, @excel_data
      )
    `);

    // Process and store ALL assets, marking which ones are in Excel
    let excelMatchCount = 0;
    const insertMany = assetsDb.transaction((assets) => {
      for (const asset of assets) {
        const assetName = asset.clientAssetId || asset.name || asset.assetName || '';
        const inExcel = excelAssetNamesSet.has(assetName);
        const excelInfo = inExcel ? excelAssetData.get(assetName) : null;
        if (inExcel) excelMatchCount++;

        upsert.run({
          id: asset.id || asset.assetId,
          name: asset.clientAssetId || asset.name || asset.assetName || '',
          // Merge Excel category and location with ACC data (Excel takes priority)
          category: (excelInfo?.category) || asset.category || asset.assetCategory || '',
          description: asset.description || (excelInfo?.description) || '',
          location: (excelInfo?.location) || asset.location || asset.locationDescription || '',
          status: asset.status || asset.assetStatus || '',
          barcode: asset.barcode || '',
          discipline: asset.discipline || '',
          equipment_type: asset.equipmentType || asset.equipment_type || '',
          manufacturer: asset.manufacturer || '',
          model_number: asset.modelNumber || asset.model_number || '',
          serial_number: asset.serialNumber || asset.serial_number || '',
          meta_part_number: asset.metaPartNumber || asset.meta_part_number || '',
          warranty_start_date: asset.warrantyStartDate || asset.warranty_start_date || '',
          warranty_end_date: asset.warrantyEndDate || asset.warranty_end_date || '',
          container_id: asset.containerId || projectId,
          synced_at: syncedAt,
          raw_data: JSON.stringify(asset),
          excel_data: inExcel ? 'true' : 'false'
        });
      }
    });

    insertMany(allAssets);

    console.log(`📊 Stored ${allAssets.length} total assets, ${excelMatchCount} match Excel filter`);

    res.json({
      success: true,
      message: `Successfully synced ${allAssets.length} assets from ACC API (${excelMatchCount} match Excel)`,
      count: allAssets.length,
      excelMatches: excelMatchCount,
      excelCount: excelAssetNames.length,
      syncedAt
    });

  } catch (error) {
    console.error('Error syncing assets from ACC:', error.response?.data || error.message);

    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to sync assets';

    res.status(status).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
};

// Get sync status/metadata
export const getSyncStatus = (req, res) => {
  try {
    const assetsDb = getAssetsDb(req.siteId);
    const result = assetsDb.prepare(`
      SELECT
        COUNT(*) as total_assets,
        MAX(synced_at) as last_sync,
        COUNT(DISTINCT category) as unique_categories
      FROM assets
    `).get();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
};

// Delete a specific asset from local database
export const deleteAsset = (req, res) => {
  const { assetId } = req.params;

  try {
    const assetsDb = getAssetsDb(req.siteId);
    const result = assetsDb.prepare('DELETE FROM assets WHERE id = ?').run(assetId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete asset'
    });
  }
};
