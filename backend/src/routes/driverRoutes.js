import express from 'express';
import { getDrivers, getDriverById, createDriver, deleteDriver, updateDriver } from '../controllers/driverController.js';

const router = express.Router();

// Driver routes
router.get('/', getDrivers);
router.get('/:id', getDriverById);
router.post('/', createDriver);
router.delete('/:id', deleteDriver);
router.put('/:id', updateDriver);

export default router;
