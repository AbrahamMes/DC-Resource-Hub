import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import appConfig from '../config/config.js';
import { randomUUID } from 'crypto';
import { atomicWriteFileSync } from '../utils/atomicFile.js';
import {
  getSiteDefaultScheduleId,
  hasValidScheduleSignature,
  setSiteDefaultScheduleId
} from '../utils/scheduleFiles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEDULES_DIR = path.join(__dirname, '../../data');
const SCHEDULES_CONFIG_FILE = path.join(SCHEDULES_DIR, 'schedules-config.json');

// Ensure config file exists
if (!fs.existsSync(SCHEDULES_CONFIG_FILE)) {
  atomicWriteFileSync(SCHEDULES_CONFIG_FILE, JSON.stringify({ schedules: [], defaultScheduleIds: {} }, null, 2));
}

// Helper to read schedules config
const readConfig = () => {
  const data = fs.readFileSync(SCHEDULES_CONFIG_FILE, 'utf8');
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed.schedules)) {
    throw new Error('Schedule configuration is invalid: schedules must be an array');
  }
  return parsed;
};

// Helper to write schedules config
const writeConfig = (config) => {
  atomicWriteFileSync(SCHEDULES_CONFIG_FILE, JSON.stringify(config, null, 2));
};

function removeUploadedFile(file) {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

// Get all schedules
export const getSchedules = (req, res) => {
  try {
    const config = readConfig();
    const siteId = req.siteId;

    // Filter schedules for current site
    const siteSchedules = config.schedules.filter(s => s.siteId === siteId);

    res.json({
      success: true,
      schedules: siteSchedules,
      defaultScheduleId: getSiteDefaultScheduleId(config, siteId)
    });
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get schedules'
    });
  }
};

// Upload a new schedule
export const uploadSchedule = (req, res) => {
  try {
    const pin = String(req.get('x-admin-pin') || req.body.pin || '').trim();
    const siteId = req.siteId;

    // Verify PIN
    if (!appConfig.syncPin || pin !== appConfig.syncPin) {
      removeUploadedFile(req.file);
      return res.status(403).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (!hasValidScheduleSignature(file.path, file.originalname)) {
      removeUploadedFile(file);
      return res.status(400).json({
        success: false,
        error: 'The uploaded file content does not match its PDF, image, or Excel extension.'
      });
    }

    // Read config
    const config = readConfig();

    // Create schedule entry
    const scheduleId = randomUUID();
    const relativePath = `/schedules/${file.filename}`;

    const newSchedule = {
      id: scheduleId,
      siteId: siteId,
      label: file.originalname,
      filename: file.filename,
      path: relativePath,
      type: fileExt === '.pdf' ? 'pdf' : ['.xlsx', '.xls'].includes(fileExt) ? 'excel' : 'image',
      uploadedAt: new Date().toISOString(),
      isStarred: false
    };

    config.schedules.push(newSchedule);

    // If this is the first schedule, make it default
    const siteSchedules = config.schedules.filter((schedule) => schedule.siteId === siteId);
    if (siteSchedules.length === 1) {
      setSiteDefaultScheduleId(config, siteId, scheduleId);
    }

    writeConfig(config);

    res.json({
      success: true,
      schedule: newSchedule
    });
  } catch (error) {
    removeUploadedFile(req.file);
    console.error('Error uploading schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload schedule'
    });
  }
};

// Delete a schedule
export const deleteSchedule = (req, res) => {
  try {
    const { scheduleId } = req.params;
    const pin = String(req.get('x-admin-pin') || req.body.pin || '').trim();
    const siteId = req.siteId;

    // Verify PIN
    if (!appConfig.syncPin || pin !== appConfig.syncPin) {
      return res.status(403).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    const config = readConfig();
    const scheduleIndex = config.schedules.findIndex(s => s.id === scheduleId && s.siteId === siteId);

    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    const schedule = config.schedules[scheduleIndex];

    // Delete the file
    const safeFilename = path.basename(schedule.filename || '');
    const possiblePaths = [
      path.join(SCHEDULES_DIR, siteId, 'schedules', safeFilename),
      path.join(SCHEDULES_DIR, safeFilename),
      path.join(SCHEDULES_DIR, 'schedules', safeFilename)
    ];
    const filePath = possiblePaths.find((candidate) => fs.existsSync(candidate));
    if (filePath) fs.unlinkSync(filePath);

    // Remove from config
    config.schedules.splice(scheduleIndex, 1);

    // If this was the default, set a new default
    if (getSiteDefaultScheduleId(config, siteId) === scheduleId) {
      const siteSchedules = config.schedules.filter(s => s.siteId === siteId);
      setSiteDefaultScheduleId(config, siteId, siteSchedules.length > 0 ? siteSchedules[0].id : null);
    }

    writeConfig(config);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule'
    });
  }
};

// Star/favorite a schedule (make it default)
export const starSchedule = (req, res) => {
  try {
    const { scheduleId } = req.params;
    const siteId = req.siteId;

    const config = readConfig();
    const schedule = config.schedules.find(s => s.id === scheduleId && s.siteId === siteId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    // Update all schedules for this site - remove star
    config.schedules.forEach(s => {
      if (s.siteId === siteId) {
        s.isStarred = false;
      }
    });

    // Star the selected schedule
    schedule.isStarred = true;
    setSiteDefaultScheduleId(config, siteId, scheduleId);

    writeConfig(config);

    res.json({
      success: true,
      message: 'Schedule starred successfully',
      defaultScheduleId: scheduleId
    });
  } catch (error) {
    console.error('Error starring schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to star schedule'
    });
  }
};
