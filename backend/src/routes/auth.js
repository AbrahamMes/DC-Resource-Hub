import express from 'express';
import { login, callback, status, logout } from '../controllers/authController.js';

const router = express.Router();

// Initiate OAuth login
router.get('/login', login);

// OAuth callback from Autodesk
router.get('/callback', callback);

// Check authentication status
router.get('/status', status);

// Logout
router.post('/logout', logout);

export default router;
