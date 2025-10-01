import express from 'express';
import { 
  getDashboardStats,
  getBookingAnalytics,
  getRevenueAnalytics,
  getCarUtilization,
  getTopCustomers,
  getAvailableYears
} from '../controllers/analyticsController.js';
import { verifyToken, adminOrStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Analytics routes - require admin/staff authentication
router.use(verifyToken);
router.use(adminOrStaff);

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// Booking analytics
router.get('/bookings', getBookingAnalytics);

// Revenue analytics
router.get('/revenue', getRevenueAnalytics);

// Car utilization statistics
router.get('/cars/utilization', getCarUtilization);

// Top customers
router.get('/customers/top', getTopCustomers);

// Available years
router.get('/years', getAvailableYears);

export default router;