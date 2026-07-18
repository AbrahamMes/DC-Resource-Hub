import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getSchedules, uploadSchedule, deleteSchedule, starSchedule } from '../controllers/schedulesController.js';
import { siteContext } from '../middleware/siteContext.js';
import { isAllowedScheduleExtension } from '../utils/scheduleFiles.js';
import appConfig from '../config/config.js';
import { getDataDir, resolveDataPath } from '../utils/storagePaths.js';

const router = express.Router();

// Apply site context to all routes
router.use(siteContext);

const dataRoot = getDataDir();

function requireScheduleAdminPin(req, res, next) {
  const pin = String(req.get('x-admin-pin') || '').trim();
  if (!appConfig.syncPin || pin !== appConfig.syncPin) {
    return res.status(403).json({ success: false, error: 'Invalid PIN' });
  }
  next();
}

function getSiteSchedulesDir(siteId) {
  return resolveDataPath(`${siteId}/schedules`, `${siteId} schedules directory`);
}

function getSafeFilename(filename) {
  return path.basename(String(filename || ''));
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (ext === '.xls') return 'application/vnd.ms-excel';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';

  return 'application/octet-stream';
}

function isExcelFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ext === '.xlsx' || ext === '.xls';
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = getSiteSchedulesDir(req.siteId);

    fs.mkdirSync(uploadsDir, {
      recursive: true
    });

    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'schedule-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!isAllowedScheduleExtension(file.originalname)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
    }
    cb(null, true);
  },
  limits: {
    files: 1,
    fileSize: 50 * 1024 * 1024
  }
});

// Get all schedules
router.get('/', getSchedules);

// Upload a new schedule (PIN protected)
router.post('/upload', requireScheduleAdminPin, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();

    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Schedule files must be 50 MB or smaller.'
      : 'Only PDF, JPG, PNG, XLSX, and XLS schedule files are allowed.';
    res.status(400).json({ success: false, error: message });
  });
}, uploadSchedule);

// Serve uploaded schedule files from backend
router.get('/file/:filename', (req, res) => {
  const filename = getSafeFilename(req.params.filename);

  if (!filename) {
    return res.status(400).send('Missing schedule filename');
  }

  const possiblePaths = [
    // New correct folder
    path.join(getSiteSchedulesDir(req.siteId), filename),

    // Old fallback folder from previous upload setup
    path.join(dataRoot, filename),

    // Extra fallback in case a schedules folder was created directly under data
    path.join(dataRoot, 'schedules', filename)
  ];

  const filePath = possiblePaths.find((candidatePath) => fs.existsSync(candidatePath));

  if (!filePath) {
    return res.status(404).send(`Schedule file not found: ${filename}`);
  }

  const contentType = getContentType(filename);

  res.setHeader('Content-Type', contentType);

  if (isExcelFile(filename)) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  } else {
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  }

  res.sendFile(filePath);
});

// Delete a schedule (PIN protected)
router.delete('/:scheduleId', requireScheduleAdminPin, deleteSchedule);

// Star/favorite a schedule
router.post('/:scheduleId/star', starSchedule);

export default router;
