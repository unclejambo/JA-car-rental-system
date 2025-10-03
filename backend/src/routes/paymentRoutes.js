import express from 'express';
import { getPayments, createPayment, deletePayment, fixAllBookingStatusInconsistencies } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/', getPayments);
router.post('/', createPayment);
router.delete('/:id', deletePayment);
router.post('/fix-booking-status', fixAllBookingStatusInconsistencies);

export default router;
