import express from 'express';
import {
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
} from '../controllers/customerProfileController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer profile routes - all require authentication
router.use(verifyToken); // Apply authentication middleware to all routes

// GET /customer-profile - Get customer profile
router.get('/', getCustomerProfile);

// PUT /customer-profile - Update customer profile
router.put('/', updateCustomerProfile);

// PATCH /customer-profile/change-password - Change password only
router.patch('/change-password', changeCustomerPassword);

export default router;
