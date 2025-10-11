import express from "express";
import {
  getDriverProfile,
  updateDriverProfile,
  changeDriverPassword,
} from "../controllers/driverProfileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Driver profile routes - all require authentication
router.use(verifyToken); // Apply authentication middleware to all routes

router.put("/", updateDriverProfile);
router.get("/", getDriverProfile);
router.patch("/change-password", changeDriverPassword);

export default router;
