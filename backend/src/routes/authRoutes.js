import express from 'express';
import { login, validateToken } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/validate - Protected route to validate token
router.get('/validate', verifyToken, validateToken);

export default router;