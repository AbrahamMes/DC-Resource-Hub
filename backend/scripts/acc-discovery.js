import axios from 'axios';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API_BASE = 'https://developer.api.autodesk.com';

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requireOption(name) {
  const value = option(name);
  if (!value) throw new Error(`Missing required option: --${name} <id>`);
  return value;
}

function recordsFromPage(page) {
  if (Array.isArray(page)) return page;
  for (const key of ['data', 'results', 'items', 'companies', 'users', 'projects', 'categories']) {
    if (Array.isArray(page?.[key])) return page[key];
  }
  return [];
}

function nextPageUrl(page, currentUrl, recordCount) {
  const linkedNext = page?.links?.next?.href || page?.links?.next || page?.pagination?.nextUrl;
  if (linkedNext) return new URL(linkedNext, currentUrl).toString();

  const pagination = page?.pagination || {};
  const offset = Number(pagination.offset ?? page?.offset);
  const limit = Number(pagination.limit ?? page?.limit);
  const total = Number(pagination.totalResults ?? pagination.total ?? page?.totalResults ?? page?.total);
  if (Number.isFinite(offset) && Number.isFinite(limit) && limit > 0 && offset + recordCount < total) {
    const next = new URL(currentUrl);
    next.searchParams.set('offset', String(offset + limit));
    return next.toString();
  }
  return null;
}

export async function paginate(initialUrl, requestPage) {
  const records = [];
  const visited = new Set();
  let url = initialUrl;

  while (url) {
    if (visited.has(url)) throw new Error(`Autodesk pagination loop detected at ${url}`);
    visited.add(url);
    const page = await requestPage(url);
    const pageRecords = recordsFromPage(page);
    records.push(...pageRecords);
    url = nextPageUrl(page, url, pageRecords.length);
  }
  return records;
}

async function accessTokenFromSavedSession() {
  const [{ default: SqliteSessionStore }, { getValidAccessToken }, { resolveDataPath }] = await Promise.all([
    import('../src/session/sqliteSessionStore.js'),
    import('../src/services/autodeskTokenService.js'),
    import('../src/utils/storagePaths.js')
  ]);
  const store = new SqliteSessionStore({
    dbPath: resolveDataPath('sessions.db'),
    cleanupIntervalMs: 60_000,
    defaultTtlMs: 24 * 60 * 60 * 1000
  });
  try {
    const saved = store.findMostRecentWithRefreshToken();
    if (!saved) throw new Error('No renewable Autodesk login was found; login through the application or set APS_ACCESS_TOKEN');
    const accessToken = await getValidAccessToken(saved.sessionData);
    await new Promise((resolve, reject) => store.set(saved.sid, saved.sessionData, (error) => error ? reject(error) : resolve()));
    return accessToken;
  } finally {
    store.close();
  }
}

async function getAccessToken() {
  return process.env.APS_ACCESS_TOKEN?.trim() || accessTokenFromSavedSession();
}

function explainAutodeskError(error) {
  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.developerMessage;
  if (status === 401) return 'Autodesk authentication expired or the access token is invalid. Login again or replace APS_ACCESS_TOKEN.';
  if (status === 403) return `Autodesk denied access. Confirm account:read/data:read scopes, app provisioning, and account/project permissions.${detail ? ` ${detail}` : ''}`;
  if (status === 404) return `Autodesk resource was not found or is inaccessible. Verify the account/project ID and user permissions.${detail ? ` ${detail}` : ''}`;
  return detail || error.message;
}

async function createClient() {
  const accessToken = await getAccessToken();
  return async (url) => {
    try {
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      return response.data;
    } catch (error) {
      throw new Error(explainAutodeskError(error));
    }
  };
}

function attributes(record) {
  return record?.attributes || record || {};
}

function output(records, columns) {
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(records, null, 2));
    return;
  }
  console.table(records.map((record) => Object.fromEntries(
    Object.entries(columns).map(([heading, value]) => [heading, typeof value === 'function' ? value(record) : record?.[value]])
  )));
  console.log(`${records.length} record(s)`);
}

async function listHubs(request) {
  return paginate(`${API_BASE}/project/v1/hubs`, request);
}

async function run(command, request) {
  if (command === 'list-hubs') {
    const hubs = await listHubs(request);
    return output(hubs, { Name: (r) => attributes(r).name, ID: 'id', Type: (r) => attributes(r).extension?.type });
  }
  if (command === 'list-projects') {
    const hub = encodeURIComponent(requireOption('hub'));
    const projects = await paginate(`${API_BASE}/project/v1/hubs/${hub}/projects`, request);
    return output(projects, { Name: (r) => attributes(r).name, ID: 'id', Hub: () => option('hub'), Type: (r) => attributes(r).extension?.type });
  }
  if (command === 'list-accounts') {
    const hubs = await listHubs(request);
    const accounts = hubs.filter((hub) => String(attributes(hub).extension?.type || '').includes('bim360'))
      .map((hub) => ({ id: String(hub.id).replace(/^b\./, ''), hubId: hub.id, name: attributes(hub).name, type: attributes(hub).extension?.type }));
    return output(accounts, { Name: 'name', 'Account ID': 'id', 'Hub ID': 'hubId', Type: 'type' });
  }
  if (command === 'list-companies' || command === 'find-company') {
    const account = encodeURIComponent(requireOption('account'));
    let companies = await paginate(`${API_BASE}/hq/v1/accounts/${account}/companies?limit=100&offset=0`, request);
    if (command === 'find-company') {
      const name = requireOption('name').toLocaleLowerCase();
      companies = companies.filter((company) => String(attributes(company).name || '').toLocaleLowerCase().includes(name));
    }
    return output(companies, { Name: (r) => attributes(r).name, ID: 'id', Trade: (r) => attributes(r).trade, Account: () => option('account') });
  }
  if (command === 'list-project-users') {
    const account = encodeURIComponent(requireOption('account'));
    const project = encodeURIComponent(requireOption('project'));
    const users = await paginate(`${API_BASE}/construction/admin/v1/accounts/${account}/projects/${project}/users?limit=100&offset=0`, request);
    return output(users, { Name: (r) => attributes(r).name, ID: 'id', Email: (r) => attributes(r).email, Company: (r) => attributes(r).companyName, Project: () => option('project') });
  }
  if (command === 'inspect-assignees') {
    const project = encodeURIComponent(requireOption('project'));
    const issues = await paginate(`${API_BASE}/construction/issues/v1/projects/${project}/issues?limit=100&offset=0`, request);
    const counts = new Map();
    for (const issue of issues) {
      const value = issue.assignedTo || issue.assignedToId || attributes(issue).assignedTo;
      const type = issue.assignedToType || attributes(issue).assignedToType || 'unknown';
      if (!value) continue;
      const key = `${type}:${value}`;
      counts.set(key, { id: value, type, count: (counts.get(key)?.count || 0) + 1 });
    }
    return output([...counts.values()], { ID: 'id', Type: 'type', Issues: 'count' });
  }
  if (command === 'list-asset-categories') {
    const project = encodeURIComponent(requireOption('project'));
    const categories = await paginate(`${API_BASE}/construction/assets/v2/projects/${project}/categories?limit=100&offset=0`, request);
    return output(categories, { Name: (r) => attributes(r).name, ID: 'id', Parent: (r) => attributes(r).parentId, Project: () => option('project') });
  }
  throw new Error(`Unknown discovery command: ${command || '(missing)'}`);
}

export async function main() {
  try {
    await run(process.argv[2], await createClient());
  } catch (error) {
    console.error(`ACC discovery failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
