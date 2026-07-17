import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { atomicWriteFile, atomicWriteFileSync } from '../src/utils/atomicFile.js';
import {
  getSiteDefaultScheduleId,
  hasValidScheduleSignature,
  isAllowedScheduleExtension,
  setSiteDefaultScheduleId
} from '../src/utils/scheduleFiles.js';
import { requireSiteAccess } from '../src/middleware/siteAccess.js';

test('atomic writers replace files without leaving temporary files', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-atomic-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'config.json');

  atomicWriteFileSync(filePath, '{"version":1}');
  await atomicWriteFile(filePath, '{"version":2}');

  assert.equal(fs.readFileSync(filePath, 'utf8'), '{"version":2}');
  assert.deepEqual(fs.readdirSync(directory), ['config.json']);
});

test('schedule validation checks extensions and actual file signatures', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-upload-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const pdfPath = path.join(directory, 'schedule.pdf');
  const fakePdfPath = path.join(directory, 'fake.pdf');
  const workbookPath = path.join(directory, 'schedule.xlsx');

  fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.7\n'));
  fs.writeFileSync(fakePdfPath, Buffer.from('MZ executable'));
  fs.writeFileSync(workbookPath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

  assert.equal(isAllowedScheduleExtension('schedule.XLSX'), true);
  assert.equal(isAllowedScheduleExtension('payload.exe'), false);
  assert.equal(hasValidScheduleSignature(pdfPath, 'schedule.pdf'), true);
  assert.equal(hasValidScheduleSignature(fakePdfPath, 'fake.pdf'), false);
  assert.equal(hasValidScheduleSignature(workbookPath, 'schedule.xlsx'), true);
});

test('default schedules are isolated by site and legacy values migrate safely', () => {
  const config = {
    schedules: [
      { id: 'ttx-old', siteId: 'TTX' },
      { id: 'txe-old', siteId: 'TXE' }
    ],
    defaultScheduleId: 'ttx-old'
  };

  assert.equal(getSiteDefaultScheduleId(config, 'TTX'), 'ttx-old');
  assert.equal(getSiteDefaultScheduleId(config, 'TXE'), null);

  setSiteDefaultScheduleId(config, 'TXE', 'txe-old');
  setSiteDefaultScheduleId(config, 'TTX', 'ttx-new');

  assert.equal(getSiteDefaultScheduleId(config, 'TTX'), 'ttx-new');
  assert.equal(getSiteDefaultScheduleId(config, 'TXE'), 'txe-old');
  assert.equal('defaultScheduleId' in config, false);
});

test('site access middleware allows only a current unlocked session', () => {
  let nextCalled = false;
  const validRequest = {
    session: { siteAccessGranted: true, siteAccessExpiresAt: Date.now() + 60_000 }
  };
  requireSiteAccess(validRequest, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);

  let statusCode;
  let payload;
  const expiredRequest = {
    session: { siteAccessGranted: true, siteAccessExpiresAt: Date.now() - 1 }
  };
  const response = {
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; }
  };
  requireSiteAccess(expiredRequest, response, () => {});

  assert.equal(statusCode, 401);
  assert.equal(payload.siteLocked, true);
  assert.equal(expiredRequest.session.siteAccessGranted, undefined);
});
