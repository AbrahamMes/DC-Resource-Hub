import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  clearSitesCache,
  getAllSites,
  getDefaultSiteId,
  getSiteConfig,
  loadSites
} from '../src/config/sites.js';
import { siteContext } from '../src/middleware/siteContext.js';

function withSitesConfig(t, config) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sites-config-'));
  const configPath = path.join(directory, 'sites.json');
  fs.writeFileSync(configPath, JSON.stringify(config));
  const previousPath = process.env.SITES_CONFIG_PATH;
  process.env.SITES_CONFIG_PATH = configPath;
  clearSitesCache();

  t.after(() => {
    if (previousPath === undefined) delete process.env.SITES_CONFIG_PATH;
    else process.env.SITES_CONFIG_PATH = previousPath;
    clearSitesCache();
    fs.rmSync(directory, { recursive: true, force: true });
  });
}

function exampleSite(overrides = {}) {
  return {
    id: 'demo',
    name: 'Demo',
    fullName: 'Demo Site',
    defaultAccProjectId: 'project-1',
    accProjects: [{ id: 'project-1', name: 'Project One' }],
    databases: {
      issues: 'demo/issues.db',
      assets: 'demo/assets.db',
      commissioning: 'demo/commissioning.db'
    },
    staticAssets: { excelFile: 'demo/imports/assets.xlsx' },
    buildings: [],
    ...overrides
  };
}

test('site definitions load from SITES_CONFIG_PATH and expose projects', (t) => {
  withSitesConfig(t, { sites: [exampleSite()] });

  assert.deepEqual(Object.keys(loadSites()), ['DEMO']);
  assert.equal(getSiteConfig('demo').accProjectId, 'project-1');
  assert.deepEqual(getAllSites()[0].accProjects, [{ id: 'project-1', name: 'Project One' }]);
});

test('default site comes from configuration order or DEFAULT_SITE_ID', (t) => {
  withSitesConfig(t, { sites: [exampleSite(), exampleSite({ id: 'second' })] });
  const previousDefault = process.env.DEFAULT_SITE_ID;
  t.after(() => {
    if (previousDefault === undefined) delete process.env.DEFAULT_SITE_ID;
    else process.env.DEFAULT_SITE_ID = previousDefault;
  });

  delete process.env.DEFAULT_SITE_ID;
  assert.equal(getDefaultSiteId(), 'DEMO');
  process.env.DEFAULT_SITE_ID = 'second';
  assert.equal(getDefaultSiteId(), 'SECOND');
  process.env.DEFAULT_SITE_ID = 'missing';
  assert.throws(() => getDefaultSiteId(), /is not present/);
});

test('site configuration rejects duplicate IDs', (t) => {
  withSitesConfig(t, { sites: [exampleSite(), exampleSite({ id: 'DEMO' })] });
  assert.throws(() => loadSites(), /Duplicate site ID/);
});

test('site configuration rejects absolute and escaping data paths', async (t) => {
  await t.test('Windows absolute paths', (subtest) => {
    withSitesConfig(subtest, {
      sites: [exampleSite({ staticAssets: { excelFile: 'C:\\Users\\Example\\assets.xlsx' } })]
    });
    assert.throws(() => loadSites(), /must be relative to DATA_DIR/);
  });

  await t.test('parent traversal', (subtest) => {
    withSitesConfig(subtest, {
      sites: [exampleSite({ databases: { ...exampleSite().databases, issues: '../issues.db' } })]
    });
    assert.throws(() => loadSites(), /must not escape DATA_DIR/);
  });
});

test('site context rejects a client project that is not configured for the site', (t) => {
  withSitesConfig(t, { sites: [exampleSite()] });
  const request = {
    query: { site: 'demo', projectId: 'another-project' },
    body: {},
    session: {}
  };
  let statusCode;
  let payload;
  const response = {
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; }
  };

  siteContext(request, response, () => assert.fail('invalid project reached the route'));

  assert.equal(statusCode, 400);
  assert.equal(payload.error, 'Invalid ACC project');
});
