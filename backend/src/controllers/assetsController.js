import axios from 'axios';
import { getAssetsDb } from '../models/databaseManager.js';
import config from '../config/config.js';

function getAccAssetName(asset) {
  return (
    asset.clientAssetId ||
    asset.name ||
    asset.assetName ||
    asset.assetNumber ||
    asset.assetTag ||
    asset.barcode ||
    ''
  );
}

function getAssetCategory(asset) {
  const category = asset.category || asset.assetCategory || '';

  if (typeof category === 'string') {
    return category;
  }

  return category.name || category.label || category.title || category.id || '';
}

function getAssetLocation(asset) {
  const location = asset.location || asset.locationDescription || '';

  if (typeof location === 'string') {
    return location;
  }

  return (
    location.name ||
    location.label ||
    location.description ||
    location.id ||
    ''
  );
}

function getControllerCategoryId(req, source = 'query') {
  const requestCategoryId =
    source === 'body'
      ? req.body?.categoryId
      : req.query?.categoryId;

  return requestCategoryId || req.siteConfig.accAssetCategoryId || null;
}

function parseRawAsset(rawData) {
  if (!rawData) return {};

  try {
    return JSON.parse(rawData);
  } catch {
    return {};
  }
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? '';
}

function getCategoryDisplayName(category, configuredCategoryName) {
  return category || configuredCategoryName || '';
}

async function fetchAssetMetadata({ accessToken, projectId }) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  const statuses = [];
  const locations = [];

  for (let offset = 0; ; offset += 100) {
    const response = await axios.get(
      `https://developer.api.autodesk.com/construction/assets/v1/projects/${projectId}/asset-statuses`,
      { headers, params: { limit: 100, offset } }
    );
    const page = response.data.results || [];
    statuses.push(...page);
    if (page.length < 100) break;
  }

  for (let offset = 0; ; offset += 100) {
    const response = await axios.get(
      `https://developer.api.autodesk.com/bim360/locations/v2/containers/${projectId}/trees/default/nodes`,
      { headers, params: { limit: 100, offset } }
    );
    const page = response.data.results || [];
    locations.push(...page);
    if (page.length < 100) break;
  }

  const statusNames = new Map(statuses.map((status) => [status.id, status.label || status.name || '']));
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const locationNames = new Map();

  function getLocationPath(locationId) {
    if (!locationId || locationNames.has(locationId)) return locationNames.get(locationId) || '';
    const names = [];
    const visited = new Set();
    let current = locationsById.get(locationId);

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      if (current.parentId && current.name && current.name !== 'Project') names.unshift(current.name);
      current = current.parentId ? locationsById.get(current.parentId) : null;
    }

    const path = names.join(' > ');
    locationNames.set(locationId, path);
    return path;
  }

  return { statusNames, getLocationPath };
}

async function enrichAssetsWithMetadata({ accessToken, projectId, assets }) {
  const { statusNames, getLocationPath } = await fetchAssetMetadata({ accessToken, projectId });

  return assets.map((asset) => ({
    ...asset,
    status: asset.status || asset.assetStatus || statusNames.get(asset.statusId) || '',
    location: asset.location || asset.locationDescription || getLocationPath(asset.locationId),
    barcode: asset.barcode || ''
  }));
}

function formatLocalAsset(row, configuredCategoryName) {
  const raw = parseRawAsset(row.raw_data);
  const assetRow = { ...row };
  delete assetRow.raw_data;
  const categoryId = firstValue(raw.categoryId, raw.category_id);
  const category = firstValue(row.category, getAssetCategory(raw));

  return {
    ...assetRow,
    name: firstValue(row.name, getAccAssetName(raw)),
    category: getCategoryDisplayName(category, configuredCategoryName),
    category_id: categoryId,
    description: firstValue(row.description, raw.description),
    location: firstValue(row.location, getAssetLocation(raw)),
    location_id: firstValue(raw.locationId, raw.location_id),
    status: firstValue(row.status, raw.assetStatus, raw.status),
    status_id: firstValue(raw.statusId, raw.status_id),
    barcode: firstValue(row.barcode, raw.barcode),
    discipline: firstValue(row.discipline, raw.discipline),
    equipment_type: firstValue(row.equipment_type, raw.equipmentType, raw.equipment_type),
    manufacturer: firstValue(row.manufacturer, raw.manufacturer),
    model_number: firstValue(row.model_number, raw.modelNumber, raw.model_number),
    serial_number: firstValue(row.serial_number, raw.serialNumber, raw.serial_number),
    meta_part_number: firstValue(row.meta_part_number, raw.metaPartNumber, raw.meta_part_number),
    warranty_start_date: firstValue(row.warranty_start_date, raw.warrantyStartDate, raw.warranty_start_date),
    warranty_end_date: firstValue(row.warranty_end_date, raw.warrantyEndDate, raw.warranty_end_date),
    created_at: firstValue(raw.createdAt, raw.created_at),
    updated_at: firstValue(raw.updatedAt, raw.updated_at),
    is_active: raw.isActive ?? raw.is_active ?? null,
    company_id: firstValue(raw.companyId, raw.company_id)
  };
}

// Get all Controller-category assets stored in the local database.
// Excel is no longer used.
export const getLocalAssets = (req, res) => {
  try {
    const assetsDb = getAssetsDb(req.siteId);
    const projectId = req.query.projectId || req.siteConfig.accProjectId;

    const assets = assetsDb.prepare(`
      SELECT
        id,
        name,
        category,
        description,
        location,
        status,
        barcode,
        discipline,
        equipment_type,
        manufacturer,
        model_number,
        serial_number,
        meta_part_number,
        warranty_start_date,
        warranty_end_date,
        container_id,
        synced_at,
        raw_data
      FROM assets
      WHERE container_id = ?
      ORDER BY name ASC
    `).all(projectId).map((asset) =>
      formatLocalAsset(asset, req.siteConfig.accAssetCategoryName)
    );

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

function saveAssetsToDatabase({
  assetsDb,
  allAssets,
  projectId,
  syncedAt
}) {
  const upsert = assetsDb.prepare(`
    INSERT OR REPLACE INTO assets (
      id,
      name,
      category,
      description,
      location,
      status,
      barcode,
      discipline,
      equipment_type,
      manufacturer,
      model_number,
      serial_number,
      meta_part_number,
      warranty_start_date,
      warranty_end_date,
      container_id,
      synced_at,
      raw_data,
      excel_data
    ) VALUES (
      @id,
      @name,
      @category,
      @description,
      @location,
      @status,
      @barcode,
      @discipline,
      @equipment_type,
      @manufacturer,
      @model_number,
      @serial_number,
      @meta_part_number,
      @warranty_start_date,
      @warranty_end_date,
      @container_id,
      @synced_at,
      @raw_data,
      @excel_data
    )
  `);

  const replaceProjectAssets = assetsDb.transaction((assets) => {
    // Delete assets from the previous sync for this project.
    // This removes old Excel-filtered rows and stale ACC assets.
    assetsDb.prepare(`
      DELETE FROM assets
      WHERE container_id = ?
         OR container_id IS NULL
         OR container_id = ''
    `).run(projectId);

    for (const asset of assets) {
      const assetId = asset.id || asset.assetId;

      if (!assetId) {
        console.warn('⚠️ Skipping ACC asset without an ID:', asset);
        continue;
      }

      upsert.run({
        id: assetId,
        name: getAccAssetName(asset),
        category: getAssetCategory(asset),
        description: asset.description || '',
        location: getAssetLocation(asset),
        status: asset.status || asset.assetStatus || '',
        barcode: asset.barcode || '',
        discipline: asset.discipline || '',
        equipment_type:
          asset.equipmentType ||
          asset.equipment_type ||
          '',
        manufacturer: asset.manufacturer || '',
        model_number:
          asset.modelNumber ||
          asset.model_number ||
          '',
        serial_number:
          asset.serialNumber ||
          asset.serial_number ||
          '',
        meta_part_number:
          asset.metaPartNumber ||
          asset.meta_part_number ||
          '',
        warranty_start_date:
          asset.warrantyStartDate ||
          asset.warranty_start_date ||
          '',
        warranty_end_date:
          asset.warrantyEndDate ||
          asset.warranty_end_date ||
          '',
        container_id: projectId,
        synced_at: syncedAt,
        raw_data: JSON.stringify(asset),

        // Kept only because the existing database table has this column.
        // It is no longer used to filter the assets.
        excel_data: 'false'
      });
    }
  });

  replaceProjectAssets(allAssets);
}

async function fetchAllAccAssets({
  accessToken,
  projectId,
  categoryId,
  res = null
}) {
  const baseUrl =
    `${config.acc.assetsApiUrl}/projects/${projectId}/assets`;

  let allAssets = [];
  const limit = 100;
  let hasMore = true;
  let requestCount = 0;
  const seenAssetIds = new Set();
  let cursorState = null;

  console.log(
    `🎯 Fetching all ACC assets in Controller category ID: ${categoryId}`
  );

  while (hasMore) {
    const params = {
      limit,
      'filter[categoryId]': categoryId
    };

    if (cursorState) {
      params.cursorState = cursorState;
    }

    const response = await axios.get(baseUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params
    });

    requestCount++;

    const pageAssets =
      response.data.results ||
      response.data.data ||
      [];

    const pagination =
      response.data.pagination ||
      {};

    console.log(
      `📊 Request ${requestCount}: Received ${pageAssets.length} assets, Pagination:`,
      JSON.stringify(pagination)
    );

    if (requestCount === 1 && pageAssets.length > 0) {
      console.log(
        '📋 Sample Controller asset structure from ACC API:'
      );

      console.log(
        '  Keys:',
        Object.keys(pageAssets[0])
      );

      console.log(
        '  First asset:',
        JSON.stringify(pageAssets[0], null, 2)
      );
    }

    let duplicateCount = 0;

    const uniquePageAssets = pageAssets.filter((asset) => {
      const assetId = asset.id || asset.assetId;

      if (!assetId || seenAssetIds.has(assetId)) {
        duplicateCount++;
        return false;
      }

      seenAssetIds.add(assetId);
      return true;
    });

    allAssets = allAssets.concat(uniquePageAssets);

    console.log(
      `📊 Added ${uniquePageAssets.length} unique assets, ` +
      `${duplicateCount} duplicates, total: ${allAssets.length}`
    );

    if (res) {
      res.write(
        `data: ${JSON.stringify({
          stage: 'fetching',
          message:
            `Fetched ${allAssets.length} Controller assets ` +
            `(Request ${requestCount})`,
          totalFetched: allAssets.length,
          requestCount,
          lastBatchSize: pageAssets.length,
          uniqueInBatch: uniquePageAssets.length,
          duplicatesInBatch: duplicateCount
        })}\n\n`
      );
    }

    if (
      duplicateCount > 0 &&
      uniquePageAssets.length === 0
    ) {
      hasMore = false;
      continue;
    }

    if (pagination.cursorState) {
      cursorState = pagination.cursorState;
    }

    if (pageAssets.length === 0) {
      hasMore = false;
    } else if (pageAssets.length < limit) {
      hasMore = false;
    } else if (
      !pagination.nextUrl &&
      !pagination.cursorState
    ) {
      hasMore = false;
    } else if (
      pagination.totalResults &&
      allAssets.length >= pagination.totalResults
    ) {
      hasMore = false;
    } else if (requestCount >= 200) {
      console.warn(
        '⚠️ Safety limit reached: stopped after 200 API requests'
      );

      hasMore = false;
    }
  }

  return {
    allAssets,
    requestCount
  };
}

// Sync all assets from the configured ACC Controller category.
// This version sends progress through Server-Sent Events.
export const authorizeAssetSync = (req, res, next) => {
  if (!req.session.accessToken) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      needsAuth: true
    });
  }

  const pin = String(req.body?.pin || '').trim();
  if (!config.syncPin || pin !== config.syncPin) {
    return res.status(403).json({
      success: false,
      error: 'Invalid PIN.',
      needsPin: true
    });
  }

  req.session.assetSyncAuthorization = {
    siteId: req.siteId,
    projectId: req.body?.projectId || req.siteConfig.accProjectId,
    expiresAt: Date.now() + 60 * 1000
  };

  req.session.save((error) => {
    if (error) return next(error);
    return res.json({ success: true });
  });
};

export const syncAssetsWithProgress = async (req, res) => {
  const accessToken = req.session.accessToken;

  const projectId =
    req.query.projectId ||
    req.siteConfig.accProjectId;

  const categoryId =
    getControllerCategoryId(req, 'query');

  const assetsDb = getAssetsDb(req.siteId);

  const syncAuthorization = req.session.assetSyncAuthorization;
  const hasSyncAuthorization =
    syncAuthorization?.siteId === req.siteId &&
    syncAuthorization?.projectId === projectId &&
    Number(syncAuthorization.expiresAt) > Date.now();

  // Consume the short-lived grant before beginning work so it cannot be reused.
  delete req.session.assetSyncAuthorization;
  await new Promise((resolve, reject) => {
    req.session.save((error) => error ? reject(error) : resolve());
  });

  res.setHeader(
    'Content-Type',
    'text/event-stream'
  );

  res.setHeader(
    'Cache-Control',
    'no-cache'
  );

  res.setHeader(
    'Connection',
    'keep-alive'
  );

  if (!hasSyncAuthorization) {
    res.write(
      `data: ${JSON.stringify({
        error:
          'Invalid PIN. Please enter the correct PIN to proceed with sync.',
        needsPin: true
      })}\n\n`
    );

    return res.end();
  }

  if (!accessToken) {
    res.write(
      `data: ${JSON.stringify({
        error: 'Authentication required',
        needsAuth: true
      })}\n\n`
    );

    return res.end();
  }

  if (!categoryId) {
    res.write(
      `data: ${JSON.stringify({
        stage: 'error',
        success: false,
        error:
          'Controller category ID is not configured. ' +
          'Set accAssetCategoryId for this site.'
      })}\n\n`
    );

    return res.end();
  }

  try {
    res.write(
      `data: ${JSON.stringify({
        stage: 'fetching',
        message:
          'Fetching all assets from the ACC Controller category...',
        totalFetched: 0,
        requestCount: 0,
        categoryId
      })}\n\n`
    );

    const {
      allAssets,
      requestCount
    } = await fetchAllAccAssets({
      accessToken,
      projectId,
      categoryId,
      res
    });

    res.write(
      `data: ${JSON.stringify({
        stage: 'saving',
        message:
          'Replacing local assets with the ACC Controller category results...',
        totalFetched: allAssets.length
      })}\n\n`
    );

    const enrichedAssets = await enrichAssetsWithMetadata({
      accessToken,
      projectId,
      assets: allAssets
    });
    const syncedAt = new Date().toISOString();

    saveAssetsToDatabase({
      assetsDb,
      allAssets: enrichedAssets,
      projectId,
      syncedAt
    });

    console.log(
      `✅ Stored ${allAssets.length} Controller assets from ACC`
    );

    res.write(
      `data: ${JSON.stringify({
        stage: 'complete',
        success: true,
        message:
          `Successfully synced ${allAssets.length} ` +
          'Controller assets from ACC',
        count: allAssets.length,
        requestCount,
        categoryId,
        syncedAt
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error(
      'Error syncing Controller assets from ACC:',
      error.response?.data || error.message
    );

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Failed to sync Controller assets';

    res.write(
      `data: ${JSON.stringify({
        stage: 'error',
        success: false,
        error: errorMessage
      })}\n\n`
    );

    res.end();
  }
};

export async function syncAssetsForProject({
  accessToken,
  siteId,
  siteConfig,
  projectId,
  categoryId = siteConfig.accAssetCategoryId
}) {
  if (!categoryId) {
    throw new Error(
      'Controller category ID is not configured. Set accAssetCategoryId for this site.'
    );
  }

  const { allAssets, requestCount } = await fetchAllAccAssets({
    accessToken,
    projectId,
    categoryId
  });
  const enrichedAssets = await enrichAssetsWithMetadata({
    accessToken,
    projectId,
    assets: allAssets
  });
  const syncedAt = new Date().toISOString();

  saveAssetsToDatabase({
    assetsDb: getAssetsDb(siteId),
    allAssets: enrichedAssets,
    projectId,
    syncedAt
  });

  return { count: allAssets.length, requestCount, categoryId, syncedAt };
}

// Standard JSON sync for all assets in the configured
// ACC Controller category.
export const syncAssets = async (req, res) => {
  const accessToken = req.session.accessToken;

  const pin = String(req.body?.pin || '').trim();
  if (!config.syncPin || pin !== config.syncPin) {
    return res.status(403).json({
      success: false,
      error: 'Invalid PIN',
      needsPin: true
    });
  }

  const projectId =
    req.body.projectId ||
    req.siteConfig.accProjectId;

  const categoryId =
    getControllerCategoryId(req, 'body');

  const assetsDb = getAssetsDb(req.siteId);

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      needsAuth: true,
      error: 'Authentication required'
    });
  }

  if (!categoryId) {
    return res.status(400).json({
      success: false,
      error:
        'Controller category ID is not configured. ' +
        'Set accAssetCategoryId for this site.'
    });
  }

  try {
    console.log(
      `🔄 Fetching all assets from ACC Controller category ${categoryId}...`
    );

    const {
      allAssets,
      requestCount
    } = await fetchAllAccAssets({
      accessToken,
      projectId,
      categoryId
    });

    console.log(
      `✅ Total Controller assets fetched from ACC: ${allAssets.length}`
    );

    const enrichedAssets = await enrichAssetsWithMetadata({
      accessToken,
      projectId,
      assets: allAssets
    });
    const syncedAt = new Date().toISOString();

    saveAssetsToDatabase({
      assetsDb,
      allAssets: enrichedAssets,
      projectId,
      syncedAt
    });

    res.json({
      success: true,
      message:
        `Successfully synced ${allAssets.length} ` +
        'Controller assets from ACC API',
      count: allAssets.length,
      requestCount,
      categoryId,
      syncedAt
    });
  } catch (error) {
    console.error(
      'Error syncing Controller assets from ACC:',
      error.response?.data || error.message
    );

    const status =
      error.response?.status ||
      500;

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Failed to sync Controller assets';

    res.status(status).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
};

// Get sync status for the ACC Controller assets stored locally.
export const getSyncStatus = (req, res) => {
  try {
    const assetsDb = getAssetsDb(req.siteId);
    const projectId = req.query.projectId || req.siteConfig.accProjectId;

    const result = assetsDb.prepare(`
      SELECT
        COUNT(*) AS total_assets,
        MAX(synced_at) AS last_sync,
        COUNT(DISTINCT category) AS unique_categories
      FROM assets
      WHERE container_id = ?
    `).get(projectId);

    res.json({
      success: true,
      ...result,
      total_acc_assets: result.total_assets
    });
  } catch (error) {
    console.error(
      'Error getting sync status:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
};

// Delete a specific asset from the local database.
export const deleteAsset = (req, res) => {
  const { assetId } = req.params;

  try {
    const assetsDb = getAssetsDb(req.siteId);

    const result = assetsDb.prepare(`
      DELETE FROM assets
      WHERE id = ?
    `).run(assetId);

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
    console.error(
      'Error deleting asset:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to delete asset'
    });
  }
};
