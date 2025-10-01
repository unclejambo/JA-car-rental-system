import express from 'express';
import { 
  getCarWaitlist, 
  joinWaitlist, 
  getAvailableDates,
  leaveWaitlist,
  getMyWaitlistEntries,
  processWaitlistPayment
} from '../controllers/waitlistController.js';
import { verifyToken, requireCustomer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Car waitlist routes
router.get('/cars/:carId/waitlist', verifyToken, getCarWaitlist);
router.post('/cars/:carId/waitlist', verifyToken, requireCustomer, joinWaitlist);
router.get('/cars/:carId/available-dates', getAvailableDates); // Public endpoint

// Customer waitlist routes
router.get('/customers/me/waitlist', verifyToken, requireCustomer, getMyWaitlistEntries);
router.delete('/waitlist/:waitlistId', verifyToken, leaveWaitlist);

// Waitlist payment routes
router.post('/waitlist/:waitlistId/payment', verifyToken, requireCustomer, processWaitlistPayment);

export default router;