import express from 'express';
import multer from 'multer';
import { uploadLicense, uploadImage, uploadCarImage, uploadReleaseImage } from '../controllers/storageController.js';

const router = express.Router();
const upload = multer(); // memory storage

// POST /api/storage/licenses
router.post('/licenses', upload.single('file'), uploadLicense);

// POST /api/storage/upload (for general images like car images)
router.post('/upload', upload.single('image'), uploadImage);

// POST /api/storage/car-images (for car images to license bucket/car_img folder)
router.post('/car-images', upload.single('image'), uploadCarImage);

// POST /api/storage/release-images (for release images to license bucket/release_images folder)
router.post('/release-images', upload.single('image'), uploadReleaseImage);

export default router;