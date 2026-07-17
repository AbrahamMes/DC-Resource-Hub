import express from 'express';
import { accessStatus, lockAccess, unlockAccess } from '../controllers/accessController.js';
import { requireSiteAccess } from '../middleware/siteAccess.js';

const router = express.Router();

router.get('/status', accessStatus);
router.post('/unlock', unlockAccess);
router.post('/lock', requireSiteAccess, lockAccess);

export default router;

