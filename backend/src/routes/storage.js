import express from 'express';
import multer from 'multer';
import { uploadLicense, uploadImage, uploadCarImage, uploadReleaseImage, uploadProfileImage, deleteProfileImage } from '../controllers/storageController.js';
import { adminOrStaff } from '../middleware/authMiddleware.js';

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

// POST /api/storage/profile-images (for profile images to license bucket/profile_img folder)
router.post('/profile-images', adminOrStaff, upload.single('profileImage'), uploadProfileImage);

// DELETE /api/storage/profile-images (delete profile image from supabase)
router.delete('/profile-images', adminOrStaff, deleteProfileImage);

export default router;