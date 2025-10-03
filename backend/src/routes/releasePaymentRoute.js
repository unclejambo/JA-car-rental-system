import express from 'express';
import { createReleasePayment, getReleasePayments } from '../controllers/releasePaymentController.js';

const router = express.Router();

// GET /release-payments - Get all release payments (optionally filtered by booking_id)
router.get('/', getReleasePayments);

// POST /release-payments - Create a new release payment
router.post('/', createReleasePayment);

export default router;
