import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEDULES_DIR = path.join(__dirname, '../../data');
const SCHEDULES_CONFIG_FILE = path.join(SCHEDULES_DIR, 'schedules-config.json');

// Ensure config file exists
if (!fs.existsSync(SCHEDULES_CONFIG_FILE)) {
  fs.writeFileSync(SCHEDULES_CONFIG_FILE, JSON.stringify({ schedules: [], defaultScheduleId: null }, null, 2));
}

// Helper to read schedules config
const readConfig = () => {
  try {
    const data = fs.readFileSync(SCHEDULES_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { schedules: [], defaultScheduleId: null };
  }
};

// Helper to write schedules config
const writeConfig = (config) => {
  fs.writeFileSync(SCHEDULES_CONFIG_FILE, JSON.stringify(config, null, 2));
};

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
      defaultScheduleId: config.defaultScheduleId
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
    const { pin } = req.body;
    const siteId = req.siteId;

    // Verify PIN
    if (pin !== '1725') {
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
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      // Delete the uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.'
      });
    }

    // Read config
    const config = readConfig();

    // Create schedule entry
    const scheduleId = Date.now().toString();
    const relativePath = `/schedules/${file.filename}`;

    const newSchedule = {
      id: scheduleId,
      siteId: siteId,
      label: file.originalname,
      filename: file.filename,
      path: relativePath,
      type: fileExt === '.pdf' ? 'pdf' : 'image',
      uploadedAt: new Date().toISOString(),
      isStarred: false
    };

    config.schedules.push(newSchedule);

    // If this is the first schedule, make it default
    if (config.schedules.length === 1) {
      config.defaultScheduleId = scheduleId;
    }

    writeConfig(config);

    res.json({
      success: true,
      schedule: newSchedule
    });
  } catch (error) {
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
    const { pin } = req.body;
    const siteId = req.siteId;

    // Verify PIN
    if (pin !== '1725') {
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
    const filePath = path.join(SCHEDULES_DIR, schedule.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from config
    config.schedules.splice(scheduleIndex, 1);

    // If this was the default, set a new default
    if (config.defaultScheduleId === scheduleId) {
      const siteSchedules = config.schedules.filter(s => s.siteId === siteId);
      config.defaultScheduleId = siteSchedules.length > 0 ? siteSchedules[0].id : null;
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
    config.defaultScheduleId = scheduleId;

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
