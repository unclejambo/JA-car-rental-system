import express from 'express';
import {
  getSchedules,
  getSchedulesByCustomer,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getMySchedules, // added
} from '../controllers/scheduleController.js';
import { customerOnly } from '../middleware/authMiddleware.js'; // use existing middleware

const router = express.Router();

router.get('/', getSchedules);
// protected route that returns schedules for the logged-in customer
router.get('/me', customerOnly, getMySchedules);

router.get('/customer/:id', getSchedulesByCustomer);
router.get('/:id', getScheduleById);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;