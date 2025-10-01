import express from 'express';
import {
    getBookings,
    getBookingById,
    createBooking,
    createBookingRequest,
    updateBooking,
    deleteBooking,
    getMyBookings,
    cancelMyBooking,
    extendMyBooking,
    updateMyBooking,
    createMissingPaymentRecords,
} from '../controllers/bookingController.js';
import { verifyToken, requireCustomer, requireAdminOrStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin/Staff booking routes
router.get('/', verifyToken, requireAdminOrStaff, getBookings); // Admin only to see all bookings
router.get('/:id', verifyToken, getBookingById); // Authenticated users can see specific booking
router.post('/', verifyToken, requireCustomer, createBooking); // Customer only to create bookings
router.post('/request', verifyToken, requireCustomer, createBooking); // Alternative endpoint for booking requests
router.put('/:id', verifyToken, requireAdminOrStaff, updateBooking); // Admin only to update bookings
router.delete('/:id', verifyToken, requireAdminOrStaff, deleteBooking); // Admin only to delete bookings

// Customer-specific booking routes
router.get('/my-bookings/list', verifyToken, requireCustomer, getMyBookings); // Customer sees own bookings
router.put('/:id/cancel', verifyToken, requireCustomer, cancelMyBooking); // Customer cancels own booking
router.put('/:id/extend', verifyToken, requireCustomer, extendMyBooking); // Customer extends own booking
router.put('/:id/update', verifyToken, requireCustomer, updateMyBooking); // Customer updates own booking

// Utility routes
router.post('/create-missing-payments', verifyToken, requireAdminOrStaff, createMissingPaymentRecords); // Admin utility

export default router;
