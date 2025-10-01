import express from 'express';
import { getDrivers, getDriverById, createDriver, deleteDriver, updateDriver } from '../controllers/driverController.js';
import { verifyToken, requireAdminOrStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Driver routes with authentication
router.get('/', verifyToken, getDrivers); // Allow authenticated users to see available drivers
router.get('/:id', verifyToken, getDriverById); // Allow authenticated users to see driver details
router.post('/', verifyToken, requireAdminOrStaff, createDriver); // Admin only to create drivers
router.delete('/:id', verifyToken, requireAdminOrStaff, deleteDriver); // Admin only to delete drivers
router.put('/:id', verifyToken, requireAdminOrStaff, updateDriver); // Admin only to update drivers

export default router;
