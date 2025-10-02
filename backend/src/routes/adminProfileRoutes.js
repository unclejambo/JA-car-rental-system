import express from 'express';
import { getAdminProfile, updateAdminProfile, changeAdminPassword, getAllAdmins } from '../controllers/adminProfileController.js';
import { adminOnly, adminOrStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /admin-profile/all - Get all admins/staff (admin only)
router.get('/all', adminOnly, getAllAdmins);

// GET /admin-profile - Get admin profile (admin or staff)
router.get('/', adminOrStaff, getAdminProfile);

// PUT /admin-profile - Update admin profile (admin or staff)
router.put('/', adminOrStaff, updateAdminProfile);

// PUT /admin-profile/change-password - Change password only (admin or staff)
router.put('/change-password', adminOrStaff, changeAdminPassword);

export default router;