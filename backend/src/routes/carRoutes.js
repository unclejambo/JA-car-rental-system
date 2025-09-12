import express from 'express';
import {
  getCars,
  getCarGps,
  createCar,
  updateCar,
  deleteCar,
} from '../controllers/carController.js';

const router = express.Router();

// Public routes
router.get('/', getCars);
router.get('/:id/gps', getCarGps);

// Protected routes (add authentication middleware later)
router.post('/create', createCar);    // use "api/cars/create"  -> POST
router.put('/:id', updateCar);        // use "api/cars/:id"     -> PUT
router.delete('/:id', deleteCar);     // use "api/cars/:id"     -> DELETE

export default router;
