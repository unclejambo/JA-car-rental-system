import express from 'express';
import { 
  getCarWaitlist, 
  joinWaitlist, 
  leaveWaitlist,
  getMyWaitlistEntries
} from '../controllers/waitlistController.js';
import { verifyToken, requireCustomer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Car waitlist routes - for notifications when car becomes available
router.get('/cars/:carId/waitlist', verifyToken, getCarWaitlist);
router.post('/cars/:carId/waitlist', verifyToken, requireCustomer, joinWaitlist);

// Customer waitlist routes
router.get('/customers/me/waitlist', verifyToken, requireCustomer, getMyWaitlistEntries);
router.delete('/waitlist/:waitlistId', verifyToken, leaveWaitlist);

export default router;