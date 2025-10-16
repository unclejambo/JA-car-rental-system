import express from 'express';
import { getRefunds, createRefund, getAllRefundsForAnalytics } from '../controllers/refundController.js';

const router = express.Router();

router.get('/analytics', getAllRefundsForAnalytics); // Must be before '/' route
router.get('/', getRefunds);
router.post('/', createRefund);

export default router;