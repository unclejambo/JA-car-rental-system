import express from "express";
import {
  getDrivers,
  getDriverById,
  createDriver,
  deleteDriver,
  updateDriver,
  getMyDriverSchedules,
} from "../controllers/driverController.js";
import { verifyToken, adminOrStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// Driver routes with authentication
router.get("/", verifyToken, getDrivers); // Allow authenticated users to see available drivers
router.get("/:id", verifyToken, getDriverById); // Allow authenticated users to see driver details
router.post("/", verifyToken, adminOrStaff, createDriver); // Admin only to create drivers
router.delete("/:id", verifyToken, adminOrStaff, deleteDriver); // Admin only to delete drivers
router.put("/:id", verifyToken, adminOrStaff, updateDriver); // Admin only to update drivers
// Get schedules for authenticated driver
router.get("/schedules/me", verifyToken, getMyDriverSchedules); // Add this route before export

export default router;
