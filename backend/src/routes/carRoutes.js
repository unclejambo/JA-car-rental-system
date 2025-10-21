import express from 'express';
import multer from 'multer';
import {
  getCars,
  getAvailableCars,
  getCarGps,
  getCarUnavailablePeriods,
  createCar,
  updateCar,
  deleteCar,
} from '../controllers/carController.js';

const router = express.Router();
const upload = multer(); // memory storage for file uploads

// Public routes
router.get('/', getCars);
router.get('/available', getAvailableCars);
router.get('/:id/gps', getCarGps);
router.get('/:id/unavailable-periods', getCarUnavailablePeriods);

// Protected routes (add authentication middleware later)
router.post('/', upload.single('image'), createCar);    // use "cars/"  -> POST
router.put('/:id', upload.single('image'), updateCar);        // use "cars/:id"     -> PUT
router.delete('/:id', deleteCar);     // use "cars/:id"     -> DELETE

export default router;
