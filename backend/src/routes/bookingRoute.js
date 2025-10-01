import express from 'express';
import {
    getBookings,
    getBookingById,
    createBooking,
    createBookingRequest,
    updateBooking,
    deleteBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

// Booking routes
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.post('/request', createBookingRequest); // New route for customer booking requests
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;
