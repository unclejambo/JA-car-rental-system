import express from 'express';
import { getAdminProfile, updateAdminProfile, changeAdminPassword } from '../controllers/adminProfileController.js';
import { adminOrStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin or staff authentication
router.use(adminOrStaff);

// GET /admin-profile - Get admin profile
router.get('/', getAdminProfile);

// PUT /admin-profile - Update admin profile
router.put('/', updateAdminProfile);

// PUT /admin-profile/change-password - Change password only
router.put('/change-password', changeAdminPassword);

export default router;