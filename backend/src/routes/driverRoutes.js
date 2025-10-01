import express from 'express';
import {
  getDrivers,
  getDriverById,
} from '../controllers/driverController.js';

const router = express.Router();

// Driver routes
router.get('/', getDrivers);
router.get('/:id', getDriverById);

export default router;