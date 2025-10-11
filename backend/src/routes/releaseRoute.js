import express from 'express';
import multer from 'multer';
import { createRelease, uploadReleaseImages, getReleases, getReleaseById } from '../controllers/releaseController.js';

const router = express.Router();
const upload = multer(); // memory storage

// GET /releases - Get all releases
router.get('/', getReleases);

// GET /releases/:id - Get release by ID
router.get('/:id', getReleaseById);

// POST /releases - Create a new release
router.post('/', createRelease);

// POST /releases/:release_id/images - Upload release images
router.post('/:release_id/images', upload.single('image'), uploadReleaseImages);

export default router;
