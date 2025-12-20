import express from "express";
import {
  getPayments,
  createPayment,
  processBookingPayment,
  processGroupPayment,
  getMyPayments,
  deletePayment,
  deletePaymentByBookingId,
  fixAllBookingStatusInconsistencies,
} from "../controllers/paymentController.js";
import {
  verifyToken,
  requireCustomer,
  adminOrStaff,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes
router.get("/", verifyToken, adminOrStaff, getPayments);
router.post("/", verifyToken, adminOrStaff, createPayment);

// Customer routes
router.post(
  "/process-booking-payment",
  verifyToken,
  requireCustomer,
  processBookingPayment
);
router.post(
  "/process-group-payment",
  verifyToken,
  requireCustomer,
  processGroupPayment
);
router.get("/my-payments", verifyToken, requireCustomer, getMyPayments);
router.delete('/booking/:bookingId', verifyToken, adminOrStaff, deletePaymentByBookingId);
router.delete('/:id', verifyToken, adminOrStaff, deletePayment);
router.post('/fix-booking-status', verifyToken, adminOrStaff, fixAllBookingStatusInconsistencies);

export default router;
