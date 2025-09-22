import express from 'express';
import multer from 'multer';
import { uploadLicense } from '../controllers/storageController.js';

const router = express.Router();
const upload = multer(); // memory storage

// POST /api/storage/licenses
router.post('/licenses', upload.single('file'), uploadLicense);

export default router;