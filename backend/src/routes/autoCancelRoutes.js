import express from "express";
import { manualTriggerAutoCancel } from "../utils/autoCancel.js";
import { verifyToken, adminOrStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// Manual trigger for auto-cancel (admin/staff only, for testing)
router.post("/auto-cancel/trigger", verifyToken, adminOrStaff, manualTriggerAutoCancel);

export default router;
