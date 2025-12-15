import express from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  deleteCustomer,
  updateCustomer,
  getCurrentCustomer,
  updateNotificationSettings,
  createWalkInCustomer,
  convertWalkInToRegistered,
} from "../controllers/customerController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes
// Use "/customers" as the base path for these routes

// Protected routes (require authentication)
router.get("/me", verifyToken, getCurrentCustomer);
router.put("/me/notification-settings", verifyToken, updateNotificationSettings);

// Public/Admin routes
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.post("/walk-in", createWalkInCustomer); // Quick walk-in customer creation
router.put("/:id/convert-to-registered", convertWalkInToRegistered); // Convert walk-in to full account
router.delete("/:id", deleteCustomer);
router.put("/:id", updateCustomer);

export default router;
