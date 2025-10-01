import express from 'express';
import { getAdminProfile, updateAdminProfile, changeAdminPassword, getAllAdmins } from '../controllers/adminProfileController.js';
import { adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminOnly);

// GET /admin-profile/all - Get all admins/staff
router.get('/all', getAllAdmins);

// GET /admin-profile - Get admin profile
router.get('/', getAdminProfile);

// PUT /admin-profile - Update admin profile
router.put('/', updateAdminProfile);

// PUT /admin-profile/change-password - Change password only
router.put('/change-password', changeAdminPassword);

export default router;