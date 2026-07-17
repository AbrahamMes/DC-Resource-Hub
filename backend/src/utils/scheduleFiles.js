import fs from 'fs';
import path from 'path';

export const ALLOWED_SCHEDULE_EXTENSIONS = new Set([
  '.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'
]);

const signatures = {
  '.pdf': (buffer) => buffer.subarray(0, 5).toString() === '%PDF-',
  '.jpg': (buffer) => buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  '.jpeg': (buffer) => buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  '.png': (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.xlsx': (buffer) => ['504b0304', '504b0506', '504b0708'].includes(buffer.subarray(0, 4).toString('hex')),
  '.xls': (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
};

export function isAllowedScheduleExtension(filename) {
  return ALLOWED_SCHEDULE_EXTENSIONS.has(path.extname(String(filename || '')).toLowerCase());
}

export function hasValidScheduleSignature(filePath, originalName) {
  const extension = path.extname(String(originalName || '')).toLowerCase();
  const validator = signatures[extension];
  if (!validator) return false;

  const file = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(16);
    const bytesRead = fs.readSync(file, buffer, 0, buffer.length, 0);
    return validator(buffer.subarray(0, bytesRead));
  } finally {
    fs.closeSync(file);
  }
}

export function getSiteDefaultScheduleId(config, siteId) {
  if (config.defaultScheduleIds?.[siteId]) return config.defaultScheduleIds[siteId];

  const legacyDefault = config.defaultScheduleId;
  return config.schedules?.some((schedule) =>
    schedule.id === legacyDefault && schedule.siteId === siteId
  ) ? legacyDefault : null;
}

export function setSiteDefaultScheduleId(config, siteId, scheduleId) {
  config.defaultScheduleIds = { ...(config.defaultScheduleIds || {}) };
  config.defaultScheduleIds[siteId] = scheduleId || null;
  delete config.defaultScheduleId;
}

