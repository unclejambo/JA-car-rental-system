import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  createBookingRequest,
  createBulkBookings,
  updateBooking,
  deleteBooking,
  getMyBookings,
  cancelMyBooking,
  adminCancelBooking,
  confirmCancellationRequest,
  rejectCancellationRequest,
  extendMyBooking,
  confirmExtensionRequest,
  rejectExtensionRequest,
  cancelExtensionRequest,
  updateMyBooking,
  createMissingPaymentRecords,
  confirmBooking,
  updateIsPayStatus,
} from "../controllers/bookingController.js";
import {
  verifyToken,
  requireCustomer,
  adminOrStaff,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Root routes
router.get("/", verifyToken, adminOrStaff, getBookings); // Admin only to see all bookings
router.post("/", verifyToken, requireCustomer, createBooking); // Customer only to create bookings
router.post("/request", verifyToken, requireCustomer, createBooking); // Alternative endpoint for booking requests
router.post("/bulk", verifyToken, requireCustomer, createBulkBookings); // Customer bulk booking endpoint

// Named routes (no parameters) - must be before /:id routes
router.get("/my-bookings/list", verifyToken, requireCustomer, getMyBookings); // Customer sees own bookings
router.post("/create-missing-payments", verifyToken, adminOrStaff, createMissingPaymentRecords); // Admin utility

// Specific parameterized routes - must be BEFORE generic /:id routes
router.put("/:id/confirm", verifyToken, adminOrStaff, confirmBooking); // Confirm booking
router.put("/:id/is-pay", verifyToken, adminOrStaff, updateIsPayStatus); // Update isPay status
router.put("/:id/admin-cancel", verifyToken, adminOrStaff, adminCancelBooking); // Admin cancels booking
router.put("/:id/confirm-cancellation", verifyToken, adminOrStaff, confirmCancellationRequest); // Confirm cancellation request
router.put("/:id/reject-cancellation", verifyToken, adminOrStaff, rejectCancellationRequest); // Reject cancellation request
router.put("/:id/confirm-extension", verifyToken, adminOrStaff, confirmExtensionRequest); // Confirm extension request
router.put("/:id/reject-extension", verifyToken, adminOrStaff, rejectExtensionRequest); // Reject extension request
router.post("/:id/cancel-extension", verifyToken, requireCustomer, cancelExtensionRequest); // Customer cancels own extension request
router.put("/:id/cancel", verifyToken, requireCustomer, cancelMyBooking); // Customer cancels own booking
router.put("/:id/extend", verifyToken, requireCustomer, extendMyBooking); // Customer extends own booking
router.put("/:id/update", verifyToken, requireCustomer, updateMyBooking); // Customer updates own booking

// Generic parameterized routes - must be AFTER specific routes
router.get("/:id", verifyToken, getBookingById); // Authenticated users can see specific booking
router.put("/:id", verifyToken, adminOrStaff, updateBooking); // Admin only to update bookings
router.delete("/:id", verifyToken, adminOrStaff, deleteBooking); // Admin only to delete bookings

export default router;
