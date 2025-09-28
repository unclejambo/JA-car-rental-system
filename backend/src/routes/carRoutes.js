import express from 'express';
import {
  getCars,
  getCarGps,
  createCar,
  updateCar,
  deleteCar,
} from '../controllers/carController.js';
import upload from '../middleware/upload.js';
import maintenanceRoutes from './maintenanceRoutes.js';

const router = express.Router();

// Nested maintenance routes
router.use('/:carId/maintenance', maintenanceRoutes);

// Public routes
router.get('/', getCars);
router.get('/:id/gps', getCarGps);

// Protected routes (add authentication middleware later)
router.post('/', upload.single('image'), createCar);
router.put('/:id', upload.single('image'), updateCar);
router.delete('/:id', deleteCar);

export default router;
