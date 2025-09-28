import express from 'express';
import { getRefunds, createRefund } from '../controllers/refundController.js';

const router = express.Router();

router.get('/', getRefunds);
router.post('/', createRefund);

export default router;