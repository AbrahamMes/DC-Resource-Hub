import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSchedules, uploadSchedule, deleteSchedule, starSchedule } from '../controllers/schedulesController.js';
import { siteContext } from '../middleware/siteContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Apply site context to all routes
router.use(siteContext);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../data');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'schedule-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all schedules
router.get('/', getSchedules);

// Upload a new schedule (PIN protected)
router.post('/upload', upload.single('file'), uploadSchedule);

// Delete a schedule (PIN protected)
router.delete('/:scheduleId', deleteSchedule);

// Star/favorite a schedule
router.post('/:scheduleId/star', starSchedule);

export default router;
