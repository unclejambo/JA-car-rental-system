import express from 'express';
import { 
  getPayments, 
  createPayment, deletePayment, fixAllBookingStatusInconsistencies, deletePayment, fixAllBookingStatusInconsistencies, 
  processBookingPayment, 
  getMyPayments 
} from '../controllers/paymentController.js';
import { verifyToken, requireCustomer, adminOrStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/', verifyToken, adminOrStaff, getPayments);
router.post('/', verifyToken, adminOrStaff, createPayment);

// Customer routes
router.post('/process-booking-payment', verifyToken, requireCustomer, processBookingPayment);
router.get('/my-payments', verifyToken, requireCustomer, getMyPayments);
router.delete('/:id', deletePayment);
router.post('/fix-booking-status', fixAllBookingStatusInconsistencies);
router.delete('/:id', deletePayment);
router.post('/fix-booking-status', fixAllBookingStatusInconsistencies);

export default router;
