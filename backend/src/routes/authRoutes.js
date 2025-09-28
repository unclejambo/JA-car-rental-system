import express from 'express';
import { login, register, validateToken } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register - Remove multer middleware since we're handling JSON
router.post('/register', register);

// GET /api/auth/validate - Protected route to validate token
router.get('/validate', verifyToken, validateToken);

export default router;