import express from 'express';
import {
  getLocations,
  getAssetsByLocation,
  submitEntry,
  getAllEntries,
  getEntriesByDate,
  deleteEntry
} from '../controllers/commissioningController.js';

const router = express.Router();

// Get all locations
router.get('/locations', getLocations);

// Get assets by location
router.get('/assets-by-location', getAssetsByLocation);

// Submit new commissioning entry
router.post('/submit', submitEntry);

// Get all entries
router.get('/entries', getAllEntries);

// Get entries grouped by date
router.get('/entries-by-date', getEntriesByDate);

// Delete entry
router.delete('/entries/:id', deleteEntry);

export default router;
