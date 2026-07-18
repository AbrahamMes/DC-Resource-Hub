import express from 'express';
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  updateContacts,
  verifyContactAdminPin
} from '../controllers/contactsController.js';
import { requireSite } from '../middleware/siteContext.js';

const router = express.Router();

// Apply site context to all contacts routes
router.use(requireSite);

// Get contacts for current site
router.get('/', getContacts);

// Add a new contact
router.post('/', addContact);

// Verify the PIN before exposing contact administration controls
router.post('/admin/verify', verifyContactAdminPin);

// Replace/update all contacts
router.put('/', updateContacts);

// Update one contact
router.put('/:contactId', updateContact);

// Delete one contact
router.delete('/:contactId', deleteContact);

export default router;
