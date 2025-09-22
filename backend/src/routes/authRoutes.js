import express from 'express';
import multer from 'multer';
import { login, register, validateToken } from '../controllers/authController.js';

const router = express.Router();
const upload = multer(); // memory storage

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
// attach multer middleware so register can receive multipart/form-data with key "file"
router.post('/register', upload.single('file'), register);

// GET /api/auth/validate - Protected route to validate token
router.get('/validate', validateToken);

export default router;