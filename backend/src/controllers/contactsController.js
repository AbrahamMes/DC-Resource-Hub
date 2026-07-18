import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import config from '../config/config.js';
import { atomicWriteFile } from '../utils/atomicFile.js';
import { resolveDataPath } from '../utils/storagePaths.js';

const FALLBACK_CONTACTS = [
  {
    id: 'contact-1',
    name: 'Brennan Charley',
    company: 'Prime Controls',
    email: 'b.charley@prime-controls.com',
    phone: '(505) 205-4252',
    position: 'Project Manager',
    area: ''
  },
  {
    id: 'contact-2',
    name: 'Abraham Mes',
    company: 'Prime Controls',
    email: 'a.mes@prime-controls.com',
    phone: '(208) 316-7271',
    position: 'Project Engineer',
    area: ''
  }
];

function resolveContactsPath(req) {
  const contactsPath = req.siteConfig.staticAssets.contacts;

  return resolveDataPath(contactsPath, `${req.siteId} contacts path`);
}

function createContactId() {
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeContact(contact) {
  return {
    id: String(contact.id || createContactId()).trim(),
    name: String(contact.name || '').trim(),
    company: String(contact.company || '').trim(),
    email: String(contact.email || '').trim(),
    phone: String(contact.phone || '').trim(),
    position: String(contact.position || '').trim(),
    area: String(contact.area || '').trim()
  };
}

async function ensureContactsFile(filePath) {
  const dir = path.dirname(filePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (!existsSync(filePath)) {
    await atomicWriteFile(filePath, JSON.stringify(FALLBACK_CONTACTS, null, 2), 'utf8');
  }
}

async function readContacts(filePath) {
  await ensureContactsFile(filePath);

  const raw = await readFile(filePath, 'utf8');

  if (!raw.trim()) {
    return [];
  }

  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  let needsIdSave = false;

  const contacts = parsed.map((contact) => {
    if (!contact.id) {
      needsIdSave = true;
    }

    return normalizeContact(contact);
  });

  // Important:
  // Older contacts may not have IDs. Save generated IDs back to contacts.json
  // so Edit/Delete can find the same contact later.
  if (needsIdSave) {
    await atomicWriteFile(filePath, JSON.stringify(contacts, null, 2), 'utf8');
  }

  return contacts;
}

async function saveContacts(filePath, contacts) {
  const cleanedContacts = contacts.map(normalizeContact);
  await atomicWriteFile(filePath, JSON.stringify(cleanedContacts, null, 2), 'utf8');
  return cleanedContacts;
}

function hasValidAdminPin(req) {
  const pin = String(req.get('x-admin-pin') || '').trim();
  return Boolean(config.syncPin) && pin === config.syncPin;
}

export function verifyContactAdminPin(req, res) {
  if (!hasValidAdminPin(req)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid PIN.',
      needsPin: true
    });
  }

  return res.json({ success: true, admin: true });
}

export async function getContacts(req, res) {
  try {
    const contactsPath = resolveContactsPath(req);
    const contacts = await readContacts(contactsPath);

    res.json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    console.error('Error loading contacts:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to load contacts',
      details: error.message
    });
  }
}

export async function addContact(req, res) {
  try {
    const contactsPath = resolveContactsPath(req);
    const newContact = normalizeContact({
      ...req.body,
      id: createContactId()
    });

    if (!newContact.name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const contacts = await readContacts(contactsPath);
    contacts.push(newContact);

    const savedContacts = await saveContacts(contactsPath, contacts);

    res.status(201).json({
      success: true,
      message: 'Contact saved successfully',
      contact: newContact,
      count: savedContacts.length,
      contacts: savedContacts
    });
  } catch (error) {
    console.error('Error saving contact:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to save contact',
      details: error.message
    });
  }
}

export async function updateContact(req, res) {
  try {
    const contactsPath = resolveContactsPath(req);
    const { contactId } = req.params;

    const updatedContact = normalizeContact({
      ...req.body,
      id: contactId
    });

    if (!updatedContact.name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const contacts = await readContacts(contactsPath);
    const index = contacts.findIndex((contact) => contact.id === contactId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    contacts[index] = updatedContact;

    const savedContacts = await saveContacts(contactsPath, contacts);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact: updatedContact,
      count: savedContacts.length,
      contacts: savedContacts
    });
  } catch (error) {
    console.error('Error updating contact:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update contact',
      details: error.message
    });
  }
}

export async function deleteContact(req, res) {
  try {
    if (!hasValidAdminPin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid PIN. Contact was not deleted.',
        needsPin: true
      });
    }

    const contactsPath = resolveContactsPath(req);
    const { contactId } = req.params;

    const contacts = await readContacts(contactsPath);
    const filteredContacts = contacts.filter((contact) => contact.id !== contactId);

    if (filteredContacts.length === contacts.length) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    const savedContacts = await saveContacts(contactsPath, filteredContacts);

    res.json({
      success: true,
      message: 'Contact deleted successfully',
      count: savedContacts.length,
      contacts: savedContacts
    });
  } catch (error) {
    console.error('Error deleting contact:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to delete contact',
      details: error.message
    });
  }
}

export async function updateContacts(req, res) {
  try {
    const contactsPath = resolveContactsPath(req);
    const contacts = Array.isArray(req.body.contacts) ? req.body.contacts : [];

    const savedContacts = await saveContacts(contactsPath, contacts);

    res.json({
      success: true,
      message: 'Contacts updated successfully',
      count: savedContacts.length,
      contacts: savedContacts
    });
  } catch (error) {
    console.error('Error updating contacts:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update contacts',
      details: error.message
    });
  }
}
